/**
 * Firestore Utility Service
 * Provides retry logic and enhanced error handling for Firestore operations
 */

import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { connectionMonitor, waitForConnection } from './connectionMonitor.js';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000,  // 5 seconds
  backoffFactor: 2
};

/**
 * Sleep utility for delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay for exponential backoff
 */
const calculateDelay = (attempt) => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'internal',
    'cancelled'
  ];
  
  const retryableMessages = [
    'ERR_ABORTED',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'Failed to fetch',
    'Network request failed'
  ];
  
  return retryableCodes.includes(error.code) || 
         retryableMessages.some(msg => error.message?.includes(msg));
};

/**
 * Retry wrapper for Firestore operations
 */
export const withRetry = async (operation, context = {}, maxRetries = RETRY_CONFIG.maxRetries) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Firestore operation attempt ${attempt}/${maxRetries}`, context);
      
      // Check connection health before attempting operation
      if (attempt > 1) {
        try {
          console.log('🔍 Checking connection health before retry...');
          await waitForConnection(5000); // Wait up to 5 seconds for connection
          console.log('🌐 Connection healthy, proceeding with retry');
        } catch (connectionError) {
          console.warn('⚠️ Connection not ready, attempting network reset...');
          try {
            await connectionMonitor.forceReconnect();
          } catch (resetError) {
            console.error('❌ Network reset failed:', resetError.message);
          }
        }
      }
      
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ Firestore operation succeeded on attempt ${attempt}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      logFirestoreError(error, context.operation || 'unknown', context);
      
      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        console.log('❌ Non-retryable error, stopping attempts');
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        console.log(`❌ Max retries (${maxRetries}) reached`);
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1);
      console.log(`⏳ Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Enhanced error logging for Firestore operations
 */
export const logFirestoreError = (error, operation, context = {}) => {
  const errorInfo = {
    operation,
    code: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
    context
  };
  
  console.error('🔥 Firestore Error Details:', errorInfo);
  
  // Log specific guidance for common errors
  if (error.message?.includes('ERR_ABORTED')) {
    console.warn('💡 ERR_ABORTED suggests a network connection issue. This is usually temporary.');
  }
  
  if (error.code === 'permission-denied') {
    console.warn('💡 Permission denied. Check Firestore security rules and user authentication.');
  }
  
  if (error.code === 'quota-exceeded') {
    console.warn('💡 Quota exceeded. Check Firebase usage limits.');
  }
  
  return errorInfo;
};

/**
 * Check Firestore connection health
 */
export const checkFirestoreHealth = async () => {
  try {
    await enableNetwork(db);
    console.log('✅ Firestore connection is healthy');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection issue:', error);
    return false;
  }
};

/**
 * Gracefully handle Firestore disconnection
 */
export const handleFirestoreDisconnection = async () => {
  try {
    await disableNetwork(db);
    console.log('🔌 Firestore network disabled gracefully');
  } catch (error) {
    console.warn('⚠️ Could not disable Firestore network:', error);
  }
};

/**
 * Reconnect to Firestore
 */
export const reconnectFirestore = async () => {
  try {
    await enableNetwork(db);
    console.log('🔌 Firestore network re-enabled');
    return true;
  } catch (error) {
    console.error('❌ Could not reconnect to Firestore:', error);
    return false;
  }
};

// All functions are exported inline above