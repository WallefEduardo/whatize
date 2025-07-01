import { useState, useCallback } from 'react';

const useContactSelection = () => {
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const toggleContact = useCallback((contactId) => {
    setSelectedContacts(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(contactId)) {
        newSelection.delete(contactId);
      } else {
        newSelection.add(contactId);
      }
      return newSelection;
    });
  }, []);

  const toggleSelectAll = useCallback((contacts) => {
    if (selectAll) {
      setSelectedContacts(new Set());
      setSelectAll(false);
    } else {
      setSelectedContacts(new Set(contacts.map(contact => contact.id)));
      setSelectAll(true);
    }
  }, [selectAll]);

  const clearSelection = useCallback(() => {
    setSelectedContacts(new Set());
    setSelectAll(false);
  }, []);

  const isSelected = useCallback((contactId) => {
    return selectedContacts.has(contactId);
  }, [selectedContacts]);

  const getSelectedCount = useCallback(() => {
    return selectedContacts.size;
  }, [selectedContacts]);

  const getSelectedIds = useCallback(() => {
    return Array.from(selectedContacts);
  }, [selectedContacts]);

  return {
    selectedContacts,
    selectAll,
    toggleContact,
    toggleSelectAll,
    clearSelection,
    isSelected,
    getSelectedCount,
    getSelectedIds
  };
};

export default useContactSelection; 