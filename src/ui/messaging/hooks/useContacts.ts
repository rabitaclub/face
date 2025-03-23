import { useState, useMemo } from 'react';
import { KOLProfile } from '@/types/profile';

interface UseContactsReturn {
    contacts: KOLProfile[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredContacts: KOLProfile[];
}

export function useContacts(): UseContactsReturn {
    const [searchQuery, setSearchQuery] = useState('');
    const [contacts] = useState<KOLProfile[]>([]); // This will be populated from subgraph data

    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return contacts;

        const query = searchQuery.toLowerCase();
        return contacts.filter(contact => 
            contact.name.toLowerCase().includes(query) ||
            contact.handle.toLowerCase().includes(query) ||
            contact.wallet.toLowerCase().includes(query)
        );
    }, [contacts, searchQuery]);

    return {
        contacts,
        searchQuery,
        setSearchQuery,
        filteredContacts
    };
} 