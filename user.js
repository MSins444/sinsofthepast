// User.js — persistent identity layer

const USER_KEY = 'sop_user';

const DEFAULT_USER = {
  lastSin: '',
  beatGrimReaper: false,
  discountCode: '',
  firstVisit: true
};

// Load existing user OR create once
export function loadUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) return JSON.parse(stored);

  localStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_USER));
  return { ...DEFAULT_USER };
}

// Save updates safely
export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Utility helpers
export function grantReaperVictory(user) {
  user.beatGrimReaper = true;
  user.discountCode = 'REAPER15';
  saveUser(user);
}
