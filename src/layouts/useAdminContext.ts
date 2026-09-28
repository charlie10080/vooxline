import { useOutletContext } from 'react-router-dom';

export interface AdminContextType {
  lang: 'es' | 'en';
  setLang: React.Dispatch<React.SetStateAction<'es' | 'en'>>;
}

export const useAdminContext = () => useOutletContext<AdminContextType>();
