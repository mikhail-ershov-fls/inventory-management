export const technicians = [
  { id: 't1', name: 'Ana Ruiz', region: 'North', skills: ['HVAC', 'Electrical'], active: true, jobsToday: 4 },
  { id: 't2', name: 'Ben Okafor', region: 'South', skills: ['Plumbing'], active: true, jobsToday: 3 },
  { id: 't3', name: 'Chen Wei', region: 'East', skills: ['Electrical', 'Solar'], active: false, jobsToday: 0 },
  { id: 't4', name: 'Dara Singh', region: 'West', skills: ['HVAC'], active: true, jobsToday: 5 },
  { id: 't5', name: 'Eli Novak', region: 'North', skills: ['Plumbing', 'HVAC'], active: true, jobsToday: 2 }
]
export const jobs = [
  { id: 'J-1042', customer: 'Harbor Dental', type: 'HVAC', status: 'Scheduled', tech: 't1', date: '2026-11-12', value: 420 },
  { id: 'J-1043', customer: 'Maple Apartments', type: 'Plumbing', status: 'In progress', tech: 't2', date: '2026-11-12', value: 310 },
  { id: 'J-1044', customer: 'Northside Gym', type: 'Electrical', status: 'Completed', tech: 't1', date: '2026-11-11', value: 780 },
  { id: 'J-1045', customer: 'Riverside Cafe', type: 'HVAC', status: 'Overdue', tech: 't4', date: '2026-11-09', value: 260 },
  { id: 'J-1046', customer: 'Oak Street Clinic', type: 'Solar', status: 'Scheduled', tech: 't3', date: '2026-11-14', value: 1950 },
  { id: 'J-1047', customer: 'Bluebird School', type: 'Plumbing', status: 'Completed', tech: 't5', date: '2026-11-10', value: 540 },
  { id: 'J-1048', customer: 'City Library', type: 'Electrical', status: 'In progress', tech: 't4', date: '2026-11-12', value: 890 },
  { id: 'J-1049', customer: 'Lakeview Hotel', type: 'HVAC', status: 'Scheduled', tech: 't5', date: '2026-11-13', value: 1230 }
]
