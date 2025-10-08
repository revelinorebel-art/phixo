/**
 * Connection Monitor Service
 * Monitors Firebase/Firestore connection health and provides recovery mechanisms
 */

import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

class ConnectionMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.connectionState = 'unknown';
    this.listeners = [];
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000; // Start with 1 second
    
    this.setupEventListeners();
    this.startHealthCheck();
  }

  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      this.isOnline = true;
      this.handleConnectionRestore();
    });

    window.addEventListener('offline', () => {
      console.log('📡 Network connection lost');
      this.isOnline = false;
      this.connectionState = 'offline';
      this.notifyListeners('offline');
    });
  }

  async handleConnectionRestore() {
    console.log('🔄 Attempting to restore Firestore connection...');
    
    try {
      // Re-enable Firestore network
      await enableNetwork(db);
      this.connectionState = 'online';
      this.retryAttempts = 0;
      this.retryDelay = 1000; // Reset delay
      
      console.log('✅ Firestore connection restored successfully');
      this.notifyListeners('online');
      
    } catch (error) {
      console.error('❌ Failed to restore Firestore connection:', error);
      this.scheduleRetry();
    }
  }

  async scheduleRetry() {
    if (this.retryAttempts >= this.maxRetries) {
      console.error('🚫 Max retry attempts reached. Connection recovery failed.');
      this.connectionState = 'failed';
      this.notifyListeners('failed');
      return;
    }

    this.retryAttempts++;
    const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1); // Exponential backoff
    
    console.log(`⏳ Scheduling connection retry ${this.retryAttempts}/${this.maxRetries} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.isOnline) {
        this.handleConnectionRestore();
      }
    }, delay);
  }

  startHealthCheck() {
    // Periodic health check every 30 seconds
    setInterval(() => {
      if (this.isOnline && this.connectionState !== 'online') {
        console.log('🔍 Performing connection health check...');
        this.handleConnectionRestore();
      }
    }, 30000);
  }

  // Subscribe to connection state changes
  onConnectionChange(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(state) {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  // Get current connection state
  getConnectionState() {
    return {
      isOnline: this.isOnline,
      connectionState: this.connectionState,
      retryAttempts: this.retryAttempts
    };
  }

  // Force connection reset
  async forceReconnect() {
    console.log('🔄 Forcing Firestore reconnection...');
    
    try {
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await enableNetwork(db);
      
      this.connectionState = 'online';
      this.retryAttempts = 0;
      
      console.log('✅ Forced reconnection successful');
      this.notifyListeners('reconnected');
      
    } catch (error) {
      console.error('❌ Forced reconnection failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const connectionMonitor = new ConnectionMonitor();

// Export utility functions
export const isConnectionHealthy = () => {
  const state = connectionMonitor.getConnectionState();
  return state.isOnline && state.connectionState === 'online';
};

export const waitForConnection = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    if (isConnectionHealthy()) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error('Connection timeout'));
    }, timeout);

    const unsubscribe = connectionMonitor.onConnectionChange((state) => {
      if (state === 'online') {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve();
      } else if (state === 'failed') {
        clearTimeout(timeoutId);
        unsubscribe();
        reject(new Error('Connection failed'));
      }
    });
  });
};