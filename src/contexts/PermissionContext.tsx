import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PermissionRequest } from '@/components/PermissionRequest';

interface PermissionContextType {
  isPermissionChecked: boolean;
  hasAllPermissions: boolean;
  completePermissionCheck: (granted: boolean) => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
}

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const [isPermissionChecked, setIsPermissionChecked] = useState(false);
  const [hasAllPermissions, setHasAllPermissions] = useState(false);

  // Check if permissions were already granted in previous sessions
  useEffect(() => {
    const permissionStatus = localStorage.getItem('nutrilens-permissions-checked');
    const allGranted = localStorage.getItem('nutrilens-all-permissions-granted');
    
    if (permissionStatus === 'true') {
      setIsPermissionChecked(true);
      setHasAllPermissions(allGranted === 'true');
    }
  }, []);

  const completePermissionCheck = (granted: boolean) => {
    setIsPermissionChecked(true);
    setHasAllPermissions(granted);
    
    // Save to localStorage so we don't ask again
    localStorage.setItem('nutrilens-permissions-checked', 'true');
    localStorage.setItem('nutrilens-all-permissions-granted', granted.toString());
  };

  if (!isPermissionChecked) {
    return <PermissionRequest onComplete={completePermissionCheck} />;
  }

  return (
    <PermissionContext.Provider
      value={{
        isPermissionChecked,
        hasAllPermissions,
        completePermissionCheck,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}
