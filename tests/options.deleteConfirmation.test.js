import { jest } from '@jest/globals';

// Mock DOM elements and functions
const createMockElement = (id, properties = {}) => {
  const element = {
    id,
    style: { display: 'none' },
    textContent: '',
    focus: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    replaceWith: jest.fn(),
    cloneNode: jest.fn(),
    ...properties
  };
  
  // Make replaceWith update the original element
  element.replaceWith.mockImplementation(function(newNode) {
    Object.assign(this, newNode);
    return this;
  });
  
  // Make cloneNode return a new element with fresh event listeners
  element.cloneNode.mockImplementation(() => {
    return createMockElement(id, { ...properties });
  });
  
  return element;
};

const mockElements = {
  deleteModal: createMockElement('deleteModal'),
  deleteRuleId: createMockElement('deleteRuleId'),
  deleteRuleDesc: createMockElement('deleteRuleDesc'),
  confirmDelete: createMockElement('confirmDelete'),
  cancelDelete: createMockElement('cancelDelete')
};

// Mock DOM and global functions
global.document = {
  getElementById: jest.fn((id) => mockElements[id] || null),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.window = {};

// Mock the dependencies
const mockRules = [
  { id: 'test-rule-1', description: 'Test rule 1' },
  { id: 'test-rule-2', description: 'Test rule 2' },
  { id: 'privileged-check', description: 'Check for privileged containers' }
];

const mockSaveRules = jest.fn();
const mockRenderTable = jest.fn();
const mockShowToast = jest.fn();

// Import the functions we want to test
// Since we can't directly import from options.js (it's not a module), 
// we'll simulate the key functions here
function showDeleteConfirmation(idx) {
  const rule = mockRules[idx];
  if (!rule) return;

  const deleteModal = document.getElementById('deleteModal');
  const deleteRuleId = document.getElementById('deleteRuleId');
  const deleteRuleDesc = document.getElementById('deleteRuleDesc');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  const cancelDeleteBtn = document.getElementById('cancelDelete');

  // Populate modal with rule details
  if (deleteRuleId) deleteRuleId.textContent = rule.id || 'Unnamed rule';
  if (deleteRuleDesc) deleteRuleDesc.textContent = rule.description || 'No description';

  // Show modal
  if (deleteModal) {
    deleteModal.style.display = 'flex';
    
    // Focus management for accessibility
    if (cancelDeleteBtn) cancelDeleteBtn.focus();
  }

  // Handle confirmation
  const handleConfirm = () => {
    mockRules.splice(idx, 1);
    mockSaveRules();
    mockRenderTable();
    hideDeleteConfirmation();
    mockShowToast(`Rule "${rule.id}" deleted successfully`, { background: '#059669' });
  };

  // Handle cancellation
  const handleCancel = () => {
    hideDeleteConfirmation();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && e.target === confirmDeleteBtn) {
      e.preventDefault();
      handleConfirm();
    }
  };

  // Clean up previous event listeners (simulate the actual implementation)
  if (confirmDeleteBtn) {
    const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
    confirmDeleteBtn.replaceWith(newConfirmBtn);
    // Update our mock reference
    mockElements.confirmDelete = newConfirmBtn;
    newConfirmBtn.addEventListener('click', handleConfirm);
  }

  if (cancelDeleteBtn) {
    const newCancelBtn = cancelDeleteBtn.cloneNode(true);
    cancelDeleteBtn.replaceWith(newCancelBtn);
    // Update our mock reference  
    mockElements.cancelDelete = newCancelBtn;
    newCancelBtn.addEventListener('click', handleCancel);
  }

  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyDown);

  // Store cleanup function for later use
  global.window._deleteConfirmationCleanup = () => {
    document.removeEventListener('keydown', handleKeyDown);
  };

  // Store handlers for testing
  global.window._testHandlers = { handleConfirm, handleCancel, handleKeyDown };
}

function hideDeleteConfirmation() {
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.style.display = 'none';
  }
  
  // Clean up event listeners
  if (global.window._deleteConfirmationCleanup) {
    global.window._deleteConfirmationCleanup();
    delete global.window._deleteConfirmationCleanup;
  }
}

describe('Delete Confirmation Dialog', () => {
  beforeEach(() => {
    // Reset mocks and state
    jest.clearAllMocks();
    mockRules.length = 0;
    mockRules.push(
      { id: 'test-rule-1', description: 'Test rule 1' },
      { id: 'test-rule-2', description: 'Test rule 2' },
      { id: 'privileged-check', description: 'Check for privileged containers' }
    );
    
    // Reset element states
    Object.values(mockElements).forEach(element => {
      element.style.display = 'none';
      element.textContent = '';
      jest.clearAllMocks();
    });
  });

  describe('showDeleteConfirmation', () => {
    test('should populate modal with correct rule details', () => {
      showDeleteConfirmation(0);

      expect(mockElements.deleteRuleId.textContent).toBe('test-rule-1');
      expect(mockElements.deleteRuleDesc.textContent).toBe('Test rule 1');
    });

    test('should show modal and focus cancel button', () => {
      showDeleteConfirmation(1);

      expect(mockElements.deleteModal.style.display).toBe('flex');
      expect(mockElements.cancelDelete.focus).toHaveBeenCalledTimes(1);
    });

    test('should handle rule with missing description', () => {
      mockRules[0] = { id: 'test-rule', description: '' };
      showDeleteConfirmation(0);

      expect(mockElements.deleteRuleId.textContent).toBe('test-rule');
      expect(mockElements.deleteRuleDesc.textContent).toBe('No description');
    });

    test('should handle rule with missing ID', () => {
      mockRules[0] = { description: 'Rule without ID' };
      showDeleteConfirmation(0);

      expect(mockElements.deleteRuleId.textContent).toBe('Unnamed rule');
      expect(mockElements.deleteRuleDesc.textContent).toBe('Rule without ID');
    });

    test('should not show modal for invalid index', () => {
      showDeleteConfirmation(999);

      expect(mockElements.deleteModal.style.display).toBe('none');
    });

    test('should set up event listeners correctly', () => {
      showDeleteConfirmation(0);

      // Verify that replaceWith was called to clean up old listeners
      expect(mockElements.confirmDelete.replaceWith).toHaveBeenCalledTimes(1);
      expect(mockElements.cancelDelete.replaceWith).toHaveBeenCalledTimes(1);
      
      // Verify keyboard listener was added
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Confirmation Actions', () => {
    test('should delete rule when confirmed', () => {
      showDeleteConfirmation(1); // Delete 'test-rule-2'
      const { handleConfirm } = global.window._testHandlers;

      const originalLength = mockRules.length;
      handleConfirm();

      expect(mockRules).toHaveLength(originalLength - 1);
      expect(mockRules.find(rule => rule.id === 'test-rule-2')).toBeUndefined();
      expect(mockSaveRules).toHaveBeenCalledTimes(1);
      expect(mockRenderTable).toHaveBeenCalledTimes(1);
      expect(mockShowToast).toHaveBeenCalledWith(
        'Rule "test-rule-2" deleted successfully',
        { background: '#059669' }
      );
    });

    test('should not delete rule when cancelled', () => {
      const originalRules = [...mockRules];
      showDeleteConfirmation(1);
      const { handleCancel } = global.window._testHandlers;

      handleCancel();

      expect(mockRules).toEqual(originalRules);
      expect(mockSaveRules).not.toHaveBeenCalled();
      expect(mockRenderTable).not.toHaveBeenCalled();
    });

    test('should hide modal when cancelled', () => {
      showDeleteConfirmation(1);
      const { handleCancel } = global.window._testHandlers;

      handleCancel();

      expect(mockElements.deleteModal.style.display).toBe('none');
    });
  });

  describe('Keyboard Navigation', () => {
    test('should cancel on Escape key', () => {
      showDeleteConfirmation(0);
      const { handleKeyDown } = global.window._testHandlers;

      const mockEvent = {
        key: 'Escape',
        preventDefault: jest.fn()
      };

      handleKeyDown(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockElements.deleteModal.style.display).toBe('none');
    });

    test('should confirm on Enter key when confirm button is focused', () => {
      showDeleteConfirmation(0);
      const { handleKeyDown } = global.window._testHandlers;

      const mockEvent = {
        key: 'Enter',
        target: mockElements.confirmDelete,
        preventDefault: jest.fn()
      };

      const originalLength = mockRules.length;
      handleKeyDown(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockRules).toHaveLength(originalLength - 1);
      expect(mockSaveRules).toHaveBeenCalledTimes(1);
    });

    test('should not confirm on Enter key when other element is focused', () => {
      showDeleteConfirmation(0);
      const { handleKeyDown } = global.window._testHandlers;

      const mockEvent = {
        key: 'Enter',
        target: mockElements.cancelDelete,
        preventDefault: jest.fn()
      };

      const originalLength = mockRules.length;
      handleKeyDown(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockRules).toHaveLength(originalLength);
      expect(mockSaveRules).not.toHaveBeenCalled();
    });

    test('should ignore other keys', () => {
      showDeleteConfirmation(0);
      const { handleKeyDown } = global.window._testHandlers;

      const mockEvent = {
        key: 'Space',
        preventDefault: jest.fn()
      };

      handleKeyDown(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockElements.deleteModal.style.display).toBe('flex'); // Should still be open
    });
  });

  describe('hideDeleteConfirmation', () => {
    test('should hide modal', () => {
      mockElements.deleteModal.style.display = 'flex';
      
      hideDeleteConfirmation();

      expect(mockElements.deleteModal.style.display).toBe('none');
    });

    test('should clean up event listeners', () => {
      // Set up cleanup function
      const cleanupMock = jest.fn();
      global.window._deleteConfirmationCleanup = cleanupMock;

      hideDeleteConfirmation();

      expect(cleanupMock).toHaveBeenCalledTimes(1);
      expect(global.window._deleteConfirmationCleanup).toBeUndefined();
    });

    test('should handle missing cleanup function gracefully', () => {
      delete global.window._deleteConfirmationCleanup;

      expect(() => hideDeleteConfirmation()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing DOM elements gracefully', () => {
      // Temporarily mock getElementById to return null
      const originalGetElementById = document.getElementById;
      document.getElementById = jest.fn((id) => {
        if (id === 'deleteModal') return null;
        return mockElements[id] || null;
      });

      expect(() => showDeleteConfirmation(0)).not.toThrow();
      
      // Restore original mock
      document.getElementById = originalGetElementById;
    });

    test('should handle rule deletion from end of array', () => {
      const lastIndex = mockRules.length - 1;
      showDeleteConfirmation(lastIndex);
      const { handleConfirm } = global.window._testHandlers;

      handleConfirm();

      expect(mockRules).not.toContain(expect.objectContaining({ id: 'privileged-check' }));
    });

    test('should handle rule deletion from beginning of array', () => {
      showDeleteConfirmation(0);
      const { handleConfirm } = global.window._testHandlers;

      handleConfirm();

      expect(mockRules[0].id).toBe('test-rule-2'); // First rule should now be the second one
    });

    test('should show success message with correct rule ID', () => {
      showDeleteConfirmation(2);
      const { handleConfirm } = global.window._testHandlers;

      handleConfirm();

      expect(mockShowToast).toHaveBeenCalledWith(
        'Rule "privileged-check" deleted successfully',
        { background: '#059669' }
      );
    });
  });

  describe('Accessibility', () => {
    test('should focus cancel button when modal opens', () => {
      showDeleteConfirmation(0);

      expect(mockElements.cancelDelete.focus).toHaveBeenCalledTimes(1);
    });

    test('should support keyboard navigation for accessibility', () => {
      showDeleteConfirmation(0);
      
      // Verify that keyboard listener is properly set up
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
