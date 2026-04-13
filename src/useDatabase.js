import { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, isConfigured } from './firebase';

// 날짜 하위의 데이터 형식: { names: string[] }

export function useDatabase(currentWeekStart) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // 로컬 스토리지 키 관리
  const LOCAL_DB_KEY = 'parking_db_mock';

  useEffect(() => {
    if (!isConfigured) {
      // 로컬 스토리지 모드 로드
      const localData = localStorage.getItem(LOCAL_DB_KEY);
      if (localData) {
        setData(JSON.parse(localData));
      }
      setLoading(false);
      return;
    }

    // Firebase (Firestore) 실시간 리스너 연동
    const unavailablesRef = collection(db, 'unavailables');
    const unsubscribe = onSnapshot(unavailablesRef, (snapshot) => {
      const dbData = {};
      snapshot.forEach(doc => {
        dbData[doc.id] = doc.data().names || [];
      });
      setData(dbData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentWeekStart]);

  const addName = async (dateStr, name) => {
    if (!name.trim()) return;
    
    if (!isConfigured) {
      setData(prev => {
        const currentDateNames = prev[dateStr] || [];
        if (currentDateNames.includes(name)) return prev;
        const newData = {
          ...prev,
          [dateStr]: [...currentDateNames, name]
        };
        localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newData));
        return newData;
      });
      return;
    }

    // Firestore 처리
    try {
      const docRef = doc(db, 'unavailables', dateStr);
      const currentNames = data[dateStr] || [];
      if (!currentNames.includes(name)) {
        await setDoc(docRef, { names: [...currentNames, name] }, { merge: true });
      }
    } catch (error) {
      console.error("Error adding name: ", error);
    }
  };

  const removeName = async (dateStr, name) => {
    if (!isConfigured) {
      setData(prev => {
        const currentDateNames = prev[dateStr] || [];
        const newData = {
          ...prev,
          [dateStr]: currentDateNames.filter(n => n !== name)
        };
        localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(newData));
        return newData;
      });
      return;
    }

    // Firestore 처리
    try {
      const docRef = doc(db, 'unavailables', dateStr);
      const currentNames = data[dateStr] || [];
      await setDoc(docRef, { names: currentNames.filter(n => n !== name) }, { merge: true });
    } catch (error) {
      console.error("Error removing name: ", error);
    }
  };

  return { data, loading, addName, removeName, isConfigured };
}
