const { init, logMessage, logError, logException, requestHandler } = require('zipy-node-sdk');
init('bf4136cd');
const express = require('express');

const app = express();
app.use(express.json());
app.use(requestHandler);

const PORT = 3000;

app.use(express.json());

// First endpoint: Generate logs based on payload
app.post('/generate-logs', async (req, res) => {
  const { 
    logCount = 1, 
    logLevel = 'info',
    message = 'Test log message',
    includeError = false
  } = req.body;
  
  // Generate the specified number of logs
  for (let i = 0; i < logCount; i++) {
    const logMessage = `${message} #${i + 1}`;
    
    switch(logLevel) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
      default:
        console.log(logMessage);
    }
    
    // Add an error if requested
    if (includeError) {
      const error = new Error(`Test error from log ${i + 1}`);
      throw error;
    }
  }
  
  res.status(200).json({ 
    success: true, 
    message: `Generated ${logCount} ${logLevel} logs`
  });
});


// Second endpoint: Generate fake API calls
app.post('/generate-api-calls', async (req, res) => {
  const { 
    apiCallCount = 1,
    targetUrls = ['https://jsonplaceholder.typicode.com/posts'],
    shouldFail = false,
    delayMs = 0
  } = req.body;
  
  const results = [];

  console.warn("I am in console warn");
  console.error("I am in console error");
  console.debug("I am in console debug");
  console.info("I am in console info");
  
  for (let i = 0; i < apiCallCount; i++) {
    const url = Array.isArray(targetUrls) 
      ? targetUrls[i % targetUrls.length] 
      : targetUrls;
    
    try {
      // Log the API call
      console.log(`Making API call #${i + 1} to ${url}`);
      
      // Add delay if specified
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      // Make a real API call to demonstrate network activity
      const response = await fetch(url);
      
      console.log(`API call #${i + 1} successful`);
      results.push({
        callId: i + 1,
        url,
        success: true,
        status: response.status,
        dataPreview: JSON.stringify(response).substring(0, 100) + '...'
      });
    } catch (error) {
      console.error(`API call #${i + 1} failed:`, error.message);
      results.push({
        callId: i + 1,
        url,
        success: false,
        error: error.message
      });
    }
  }

  setTimeout(() => {
    logMessage("This is zipy log message");
    if (shouldFail) {
      try {
        logException(new Error(`This is log Exception of Zipy`));
        logError("This is log Error of Zipy");
        console.error("I am in console error", new Error("This is a test error"));
        // @ts-ignore
        (42)();  // This will throw a TypeError
      } catch (error) {
        console.error('Caught TypeError:', error.message);
        // Log the error with Zipy but don't crash
        logError(`Caught TypeError: ${error.message}`);
      }
    }
  }, 2000)
  
  res.status(200).json({
    success: true,
    apiCallsAttempted: apiCallCount,
    results
  });
});

// Third endpoint: Generate backend errors
app.post('/generate-errors', (req, res) => {
  const { unhandled, errorType } = req.body;

  if (unhandled) {
    switch (errorType) {
      case 'typeError':
        // Trying to call a number as a function
        (42)();
        // console.log("This is a console log")
        break;
      case 'referenceError':
        // Using an undefined variable
        nonExistentFunction();
        break;
      case 'syntaxError':
        // Evaluating code with a syntax error
        eval("abc def");
        break;
      case 'rangeError':
        // Creating an Array with invalid length
        new Array(-1);
        break;
      case 'uriError':
        // Incorrect use of encodeURI/decodeURI
        decodeURIComponent('%');
        break;
      case 'evalError':
        // Improper use of the eval function to throw an EvalError
        throw new EvalError('EvalError triggered');
        break;
      default:
        // Default to throwing a generic Error
        throw new Error('Default Uncaught Exception');
    }
    return;
  }

  if (req.body.shouldThrow) {
    // Simulate an error based on the request
    res.status(500).send({ error: 'Manual error triggered.' });
  } else {
    res.send('No error triggered.');
  }
});

// Fourth endpoint: Return 200 and then throw error
app.post('/success-then-error', (req, res) => {
  const { errorType = 'default' } = req.body;

  // First send a 200 response
  const response = { 
    success: true, 
    message: 'Success response sent',
    errorType: errorType,
    willThrowAfter: '1 second'
  };
  
  res.status(200).json(response);
  console.log('200 Response sent:', response);

  // Then throw an error after the response is sent
  setTimeout(() => {
    switch (errorType) {
      case 'typeError':
        (42)();
        break;
      case 'referenceError':
        nonExistentFunction();
        break;
      case 'syntaxError':
        eval("foo bar");
        break;
      case 'rangeError':
        new Array(-1);
        break;
      case 'uriError':
        decodeURIComponent('%');
        break;
      case 'evalError':
        throw new EvalError('EvalError triggered');
        break;
      default:
        throw new Error('Default error thrown after successful response');
    }
  }, 1000);
});

// Handling uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.debug(`Server running on http://localhost:${PORT}`);
  console.debug('Available endpoints:');
  console.debug('POST /generate-logs - Generate log messages');
  console.debug('POST /generate-api-calls - Generate fake API calls');
  console.debug('POST /generate-errors - Generate backend errors');
  console.debug('POST /success-then-error - Return 200 and then throw error');
});