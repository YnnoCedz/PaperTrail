// src/utils/roles.js
export const roleNameById = (id) => {
  switch (Number(id)) {
    case 1: return 'faculty';
    case 2: return 'research-staff';
    case 3: return 'extension-staff';
    case 4: return 'rds-chair';
    case 5: return 'ets-chair';
    case 6: return 'dean';
    case 7: return 'admin';
    default: return null;
  }
};

export const basePathByRoleId = (id) => {
  switch (Number(id)) {
    case 1: return '/faculty';
    case 2: return '/staff';  
    case 3: return '/ets';     
    case 4: return '/rds';     
    case 5: return '/ets';     
    case 6: return '/dean';
    case 7: return '/admin';
    default: return null;
  }
};
