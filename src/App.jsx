import { useState, useMemo } from 'react';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday, 
  isBefore, 
  startOfDay,
  isWeekend
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Car, User, Info, X } from 'lucide-react';
import { useDatabase } from './useDatabase';

const TOTAL_SPACES = 3;

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [savedName, setSavedName] = useState(() => localStorage.getItem('parking_userName') || '');
  const [nameInput, setNameInput] = useState('');

  // 날짜 계산 (월요일 시작)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const daysInWeek = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);

  // DB 훅 연동
  const { data, loading, addName, removeName, isConfigured } = useDatabase(weekStart);

  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDateClick = (day) => {
    // 과거 날짜는 막기 (옵션)
    if (isBefore(startOfDay(day), startOfDay(new Date()))) return;
    
    const dateStr = format(day, 'yyyy-MM-dd');

    if (savedName) {
      // 이미 저장된 이름이 있다면 바로 토글(추가/삭제)
      const registrations = data[dateStr] || [];
      if (registrations.includes(savedName)) {
        removeName(dateStr, savedName);
      } else {
        addName(dateStr, savedName);
      }
    } else {
      // 이름이 없으면 모달 열기
      setSelectedDate(day);
      setModalOpen(true);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newName = nameInput.trim();
    if (!newName || !selectedDate) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    addName(dateStr, newName);
    
    // 로컬 스토리지에 이름 저장
    localStorage.setItem('parking_userName', newName);
    setSavedName(newName);
    
    setNameInput('');
    setModalOpen(false);
  };

  const handleClearName = () => {
    localStorage.removeItem('parking_userName');
    setSavedName('');
    setNameInput('');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="title-area">
          <h1>주차장 미사용 등록</h1>
          <p>
            <Car size={16} /> 
            총 주차면적 {TOTAL_SPACES}대
            {!isConfigured && (
              <span className="status-badge" style={{background: '#FEF08A', color: '#854D0E', marginLeft: '8px'}}>
                <span className="dot warning"></span> 임시(로컬) 저장소 작동 중
              </span>
            )}
          </p>
          {savedName && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#4F46E5', display: 'flex', alignItems: 'center', background: '#EEF2FF', padding: '0.5rem', borderRadius: '6px' }}>
              <User size={16} style={{ marginRight: '6px' }} />
              <span><strong>{savedName}</strong>님, 날짜를 클릭하면 즉시 예약/취소됩니다.</span>
              <button 
                onClick={handleClearName} 
                className="btn-secondary"
                style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
              >
                이름 변경
              </button>
            </div>
          )}
        </div>
        
        <div className="controls">
          <button onClick={goToToday} className="btn-secondary" style={{padding: '0.5rem 1rem'}}>
            오늘
          </button>
          <button onClick={prevWeek} className="btn-icon">
            <ChevronLeft size={20} />
          </button>
          <div className="current-month">
            {format(weekStart, 'yyyy년 M월', { locale: ko })}
          </div>
          <button onClick={nextWeek} className="btn-icon">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="calendar-grid">
        {/* 요일 헤더 */}
        {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => (
          <div key={day} className={`day-header ${idx >= 5 ? 'weekend' : ''}`}>
            {day}
          </div>
        ))}

        {/* 날짜 셀 */}
        {daysInWeek.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isPastDate = isBefore(startOfDay(day), startOfDay(new Date()));
          const registrations = data[dateStr] || [];
          const spacesAvailable = Math.min(4, TOTAL_SPACES + registrations.length); // 사용가능 주차수 (기본 3대, 안쓰는 사람 생기면 그릴 필요 없음, 근데 총 인원이 4명이니 미사용이 1명이면 모두 주차가능)
          
          let statusText = '';
          let statusDot = 'dot';
          
          // 4명 중 1명 이상이 안쓴다고 하면 무조건 주차 가능
          if (registrations.length >= 1) {
            statusText = '여유 (모두 주차가능)';
            statusDot = 'dot';
          } else {
            statusText = '혼잡 (1명 주차불가)';
            statusDot = 'dot danger';
          }

          return (
            <div 
              key={day.toISOString()} 
              className={`date-cell ${isToday(day) ? 'is-today' : ''} ${isPastDate ? 'is-past' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <div className="date-number" style={{ color: isWeekend(day) ? '#EF4444' : 'inherit' }}>
                {format(day, 'd')}
                {!isPastDate && (
                   <div className="status-indicator" title={statusText}>
                     <span className={statusDot}></span>
                   </div>
                )}
              </div>
              
              <div className="registrations-list">
                {registrations.map(name => (
                  <div key={name} className="user-tag" onClick={(e) => e.stopPropagation()}>
                    <span>{name}</span>
                    <button 
                      onClick={() => removeName(dateStr, name)}
                      title="취소"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {!isPastDate && registrations.length === 0 && (
                <div className="empty-state">
                  클릭해서 등록
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>차량 미사용 등록</h2>
              <p>{selectedDate && format(selectedDate, 'PPP (EEEE)', { locale: ko })}</p>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="이름을 입력하세요 (예: 홍길동)" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>취소</button>
                <button type="submit" className="btn-primary">등록하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
