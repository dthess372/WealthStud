import { useCallback } from 'react';
import { arrayToCSV, csvToArray } from '../lib/utils';
import { FILE_SETTINGS } from '../lib/constants';

/**
 * Custom hook for CSV import/export functionality
 * @param {string} filePrefix - Prefix for downloaded filename
 * @returns {object} - Object with exportCSV and importCSV functions
 */
export function useCSV(filePrefix = 'data') {
  // Export data to CSV file
  const exportCSV = useCallback((data, filename = null, headers = null) => {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      const csvContent = arrayToCSV(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const downloadFilename = filename || `${FILE_SETTINGS.DEFAULT_FILENAME_PREFIX}${filePrefix}_${timestamp}.csv`;
      link.setAttribute('download', downloadFilename);
      
      // Trigger download
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, filename: downloadFilename };
    } catch (error) {
      console.error('Error exporting CSV:', error);
      return { success: false, error: error.message };
    }
  }, [filePrefix]);

  // Import CSV file and parse to array of objects
  const importCSV = useCallback((file, headers = null) => {
    return new Promise((resolve, reject) => {
      try {
        if (!file) {
          reject(new Error('No file provided'));
          return;
        }

        // Check file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
          reject(new Error('Please select a CSV file'));
          return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const csvText = e.target.result;
            const data = csvToArray(csvText, headers);
            resolve({ success: true, data, filename: file.name });
          } catch (parseError) {
            reject(new Error(`Error parsing CSV: ${parseError.message}`));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
      } catch (error) {
        reject(new Error(`Error importing CSV: ${error.message}`));
      }
    });
  }, []);

  // Create a file input handler for easier integration
  const createFileInputHandler = useCallback((onSuccess, onError, headers = null) => {
    return (event) => {
      const file = event.target.files[0];
      if (file) {
        importCSV(file, headers)
          .then(result => {
            onSuccess && onSuccess(result);
            // Clear the input so the same file can be selected again
            event.target.value = '';
          })
          .catch(error => {
            onError && onError(error);
            event.target.value = '';
          });
      }
    };
  }, [importCSV]);

  return {
    exportCSV,
    importCSV,
    createFileInputHandler
  };
}