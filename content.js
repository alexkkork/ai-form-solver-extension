// AI Form Solver Content Script - Complete Rewrite
console.log('AI Form Solver: Loading extension...');

// Wrap everything in IIFE to prevent conflicts
(function() {
  'use strict';
  
  // Prevent multiple loads
  if (window.AI_FORM_SOLVER_LOADED) {
    console.log('AI Form Solver already loaded');
    return;
  }
  window.AI_FORM_SOLVER_LOADED = true;
  
  // State management
  let isLearningMode = false;
  let detectedFields = [];
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request.action);
    
    // Handle async responses properly
    (async () => {
      try {
        switch (request.action) {
          case 'detectFields':
            const fields = await detectAllFormFields();
            console.log(`Detected ${fields.length} fields`);
            highlightFields(fields);
            showNotification(`Found ${fields.length} form fields!`, fields.length > 0 ? 'success' : 'error');
            sendResponse({ success: true, fieldCount: fields.length, fields });
            break;
            
          case 'solveForm':
            const result = await solveForm(request.apiKey);
            sendResponse(result);
            break;
            
          case 'learnSubmit':
            startLearningMode();
            sendResponse({ success: true });
            break;
            
          default:
            sendResponse({ success: false, error: 'Unknown action' });
        }
      } catch (error) {
        console.error('Error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep channel open for async response
  });
  
  // GOOGLE FORMS SPECIFIC DETECTION
  function detectGoogleFormsFields() {
    const fields = [];
    console.log('🔍 Detecting Google Forms fields...');
    
    // Text input fields in Google Forms - enhanced detection
    const textInputs = document.querySelectorAll(`
      input[type="text"][jsname],
      input[type="email"][jsname],
      textarea[jsname],
      input[jsaction*="focus"],
      textarea[jsaction*="focus"],
      .freebirdFormviewerComponentsQuestionTextRoot input,
      .freebirdFormviewerComponentsQuestionTextareaRoot textarea,
      .whsOnd,
      .KHxj8b,
      textarea[aria-label],
      textarea[data-initial-value],
      textarea.quantumWizTextinputPaperinputInput,
      input.quantumWizTextinputPaperinputInput,
      textarea[dir="auto"],
      input[dir="auto"][type="text"]
    `);
    
    console.log(`Found ${textInputs.length} text inputs`);
    textInputs.forEach((input, index) => {
      const question = findGoogleFormQuestion(input);
      const isTextarea = input.tagName.toLowerCase() === 'textarea';
      
      console.log(`📝 Text field ${index + 1}: "${question}" (${input.tagName.toLowerCase()}) - Element:`, input);
      
      fields.push({
        element: input,
        type: isTextarea ? 'textarea' : (input.type || 'text'),
        label: question,
        id: input.id || `gform_text_${index}`,
        name: input.name || '',
        required: input.hasAttribute('required'),
        googleForm: true
      });
    });
    
    // Radio buttons in Google Forms (exclude checkbox groups)
    const radioGroupsList = [];
    
    // Add specific radio group elements
    document.querySelectorAll('.freebirdFormviewerComponentsQuestionRadioRoot, [role="radiogroup"]').forEach(el => {
      radioGroupsList.push(el);
    });
    
    // Also check Y6Myld elements but only if they contain radio buttons and NOT checkboxes
    document.querySelectorAll('.Y6Myld').forEach(element => {
      const hasRadio = element.querySelector('[role="radio"]');
      const hasCheckbox = element.querySelector('[role="checkbox"]');
      if (hasRadio && !hasCheckbox) {
        radioGroupsList.push(element);
      }
    });
    
    const radioGroups = radioGroupsList;
    
    console.log(`Found ${radioGroups.length} radio groups`);
    Array.from(radioGroups).forEach((group, groupIndex) => {
      const question = findGoogleFormQuestion(group);
      const options = [];
      
      // Find all radio options
      const radios = group.querySelectorAll(`
        [role="radio"],
        .AB7Lab,
        .docssharedWizToggleLabeledContainer,
        span[dir="auto"]
      `);
      
      radios.forEach(radio => {
        const text = radio.textContent.trim();
        if (text && !options.includes(text)) {
          options.push(text);
        }
      });
      
      console.log(`Radio group "${question}" has options:`, options);
      
      if (radios.length > 0) {
        fields.push({
          element: group,
          type: 'radio_group',
          label: question,
          id: `gform_radio_${groupIndex}`,
          options: options,
          googleForm: true
        });
      }
    });
    
    // Checkboxes in Google Forms
    const checkboxGroups = document.querySelectorAll(`
      .freebirdFormviewerComponentsQuestionCheckboxRoot,
      [role="group"][aria-label*="checkbox"],
      .Y6Myld:has([role="checkbox"])
    `);
    
    console.log(`Found ${checkboxGroups.length} checkbox groups`);
    checkboxGroups.forEach((group, groupIndex) => {
      const question = findGoogleFormQuestion(group);
      const checkboxes = group.querySelectorAll('[role="checkbox"], .rseUEf');
      
      if (checkboxes.length > 0) {
        fields.push({
          element: group,
          type: 'checkbox_group',
          label: question,
          id: `gform_checkbox_${groupIndex}`,
          options: Array.from(checkboxes).map(cb => cb.textContent.trim()),
          googleForm: true
        });
      }
    });
    
    // Dropdown/Select in Google Forms
    const dropdowns = document.querySelectorAll(`
      [role="listbox"],
      .MocG8c,
      .vRMGwf
    `);
    
    console.log(`Found ${dropdowns.length} dropdowns`);
    dropdowns.forEach((dropdown, index) => {
      const question = findGoogleFormQuestion(dropdown);
      fields.push({
        element: dropdown,
        type: 'dropdown',
        label: question,
        id: `gform_dropdown_${index}`,
        googleForm: true
      });
    });
    
    return fields;
  }
  
  // Find the question text for a Google Form field
  function findGoogleFormQuestion(element) {
    // Try multiple strategies to find the question text
    const strategies = [
      // Look for question container
      () => {
        const container = element.closest('.freebirdFormviewerComponentsQuestionBaseRoot, .Qr7Oae');
        if (container) {
          const title = container.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle, .M7eMe, [role="heading"]');
          return title ? title.textContent.trim() : null;
        }
      },
      // Look for aria-label
      () => element.getAttribute('aria-label'),
      // Look for nearby text
      () => {
        const parent = element.closest('[role="listitem"], .freebirdFormviewerViewNumberedItemContainer');
        if (parent) {
          const text = parent.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle, .M7eMe');
          return text ? text.textContent.trim() : null;
        }
      },
      // Get first text node in parent
      () => {
        let parent = element.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          const text = Array.from(parent.childNodes)
            .filter(node => node.nodeType === 3)
            .map(node => node.textContent.trim())
            .filter(text => text.length > 0)
            .join(' ');
          if (text) return text;
          parent = parent.parentElement;
        }
      }
    ];
    
    for (const strategy of strategies) {
      const result = strategy();
      if (result) return result;
    }
    
    return 'Google Form Field';
  }
  
  // ENHANCED UNIVERSAL FORM DETECTION
  async function detectAllFormFields() {
    console.log('🔍 Starting advanced field detection...');
    detectedFields = [];
    
    // Check if this is Google Forms
    if (window.location.hostname.includes('docs.google.com') || 
        window.location.hostname.includes('forms.google.com')) {
      console.log('📋 Google Forms detected!');
      const googleFields = detectGoogleFormsFields();
      detectedFields.push(...googleFields);
    }
    
    // Enhanced selectors for ALL form types
    const enhancedSelectors = [
      // Standard inputs
      'input[type="text"]:not([readonly]):not([disabled]):not([type="hidden"])',
      'input[type="email"]:not([readonly]):not([disabled])',
      'input[type="password"]:not([readonly]):not([disabled])',
      'input[type="tel"]:not([readonly]):not([disabled])',
      'input[type="number"]:not([readonly]):not([disabled])',
      'input[type="url"]:not([readonly]):not([disabled])',
      'input[type="search"]:not([readonly]):not([disabled])',
      'input[type="date"]:not([readonly]):not([disabled])',
      'input[type="time"]:not([readonly]):not([disabled])',
      'input[type="datetime-local"]:not([readonly]):not([disabled])',
      'input[type="month"]:not([readonly]):not([disabled])',
      'input[type="week"]:not([readonly]):not([disabled])',
      'input:not([type]):not([readonly]):not([disabled]):not([type="hidden"])',
      
      // Text areas and rich text
      'textarea:not([readonly]):not([disabled])',
      '[contenteditable="true"]',
      '[role="textbox"][contenteditable="true"]',
      '.ql-editor', // Quill editor
      '.tox-edit-area', // TinyMCE
      '.cke_editable', // CKEditor
      
      // Selections
      'select:not([disabled])',
      '[role="combobox"]',
      '[role="listbox"]',
      '.select2-selection', // Select2
      '.chosen-single', // Chosen
      
      // Radio and checkboxes
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      '[role="radio"]',
      '[role="checkbox"]',
      
      // Custom form elements
      '.form-control:not([readonly]):not([disabled])',
      '.form-input:not([readonly]):not([disabled])',
      '[data-form-type="input"]',
      '[data-input]',
      '.input-field',
      
      // Modern framework specific
      'input[ng-model]', // Angular
      'input[v-model]', // Vue
      '[data-testid*="input"]', // React common pattern
      'input[formcontrolname]', // Angular Reactive Forms
      
      // Material UI and other libraries
      '.MuiInputBase-input', // Material-UI
      '.ant-input', // Ant Design
      '.el-input__inner', // Element UI
    ];
    
    // Detect fields with smart deduplication
    const processedElements = new Set();
    
    enhancedSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          // Skip if already processed or hidden
          if (processedElements.has(element) || 
              detectedFields.some(f => f.element === element) ||
              !isElementVisible(element)) {
            return;
          }
          
          processedElements.add(element);
          
          const fieldInfo = {
            element: element,
            type: getFieldType(element),
            label: getFieldLabel(element),
            id: element.id || `field_${detectedFields.length}`,
            name: element.name || element.getAttribute('data-name') || '',
            placeholder: element.placeholder || element.getAttribute('data-placeholder') || '',
            required: isFieldRequired(element),
            value: element.value || '',
            context: getFieldContext(element)
          };
          
          detectedFields.push(fieldInfo);
        });
      } catch (e) {
        console.warn(`Selector failed: ${selector}`, e);
      }
    });
    
    // Group radio buttons and checkboxes
    detectedFields = groupRelatedFields(detectedFields);
    
    console.log(`✅ Total fields detected: ${detectedFields.length}`);
    return detectedFields;
  }
  
  // Check if element is visible
  function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }
  
  // Get accurate field type
  function getFieldType(element) {
    // Check for explicit type
    if (element.type) return element.type;
    
    // Check for role attribute
    const role = element.getAttribute('role');
    if (role) {
      if (role === 'textbox') return 'text';
      if (role === 'combobox' || role === 'listbox') return 'select';
      if (role === 'radio' || role === 'checkbox') return role;
    }
    
    // Check tag name
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'select') return 'select';
    
    // Check for contenteditable
    if (element.getAttribute('contenteditable') === 'true') return 'richtext';
    
    // Check for common class patterns
    const className = element.className.toString();
    if (className.includes('date')) return 'date';
    if (className.includes('time')) return 'time';
    if (className.includes('email')) return 'email';
    if (className.includes('phone') || className.includes('tel')) return 'tel';
    if (className.includes('number')) return 'number';
    
    return 'text';
  }
  
  // Check if field is required
  function isFieldRequired(element) {
    return element.hasAttribute('required') || 
           element.hasAttribute('aria-required') ||
           element.getAttribute('data-required') === 'true' ||
           element.className.toString().includes('required');
  }
  
  // Get field context for better AI understanding
  function getFieldContext(element) {
    const context = [];
    
    // Get form section/fieldset
    const fieldset = element.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend) context.push(`Section: ${legend.textContent.trim()}`);
    }
    
    // Get nearby headings
    const container = element.closest('div, section, article');
    if (container) {
      const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) context.push(`Heading: ${heading.textContent.trim()}`);
    }
    
    return context.join(' | ');
  }
  
  // Group related fields (radio/checkbox groups)
  function groupRelatedFields(fields) {
    const grouped = [];
    const processedNames = new Set();
    
    fields.forEach(field => {
      if ((field.type === 'radio' || field.type === 'checkbox') && field.name && !processedNames.has(field.name)) {
        // Find all related fields
        const relatedFields = fields.filter(f => f.name === field.name && f.type === field.type);
        
        if (relatedFields.length > 1) {
          processedNames.add(field.name);
          grouped.push({
            element: relatedFields[0].element.parentElement,
            type: `${field.type}_group`,
            label: field.label,
            name: field.name,
            options: relatedFields.map(f => ({
              element: f.element,
              value: f.element.value,
              label: getFieldLabel(f.element)
            })),
            required: relatedFields.some(f => f.required)
          });
        } else {
          grouped.push(field);
        }
      } else if (!processedNames.has(field.name)) {
        grouped.push(field);
      }
    });
    
    return grouped;
  }
  
  // Get label for standard form fields with enhanced detection
  function getFieldLabel(element) {
    // Try multiple strategies to find the label
    const strategies = [
      // 1. Check for associated label
      () => {
        if (element.id) {
          const label = document.querySelector(`label[for="${element.id}"]`);
          if (label) return label.textContent.trim();
        }
      },
      
      // 2. Check if element is inside a label
      () => {
        const parentLabel = element.closest('label');
        if (parentLabel) {
          const text = Array.from(parentLabel.childNodes)
            .filter(node => node.nodeType === 3)
            .map(node => node.textContent.trim())
            .filter(text => text.length > 0)
            .join(' ');
          if (text) return text;
        }
      },
      
      // 3. Check aria-label
      () => element.getAttribute('aria-label'),
      
      // 4. Check placeholder
      () => element.placeholder,
      
      // 5. Check title attribute
      () => element.title,
      
      // 6. Check data attributes
      () => element.getAttribute('data-label') || element.getAttribute('data-field-label'),
      
      // 7. Check previous sibling text
      () => {
        let prev = element.previousSibling;
        while (prev && prev.nodeType !== 3) {
          prev = prev.previousSibling;
        }
        if (prev && prev.textContent) return prev.textContent.trim();
      },
      
      // 8. Check nearby text in parent
      () => {
        const parent = element.parentElement;
        if (parent) {
          const text = parent.textContent.replace(element.textContent || '', '').trim();
          if (text && text.length < 100) return text;
        }
      },
      
      // 9. Check nearby spans/divs
      () => {
        const parent = element.parentElement;
        if (parent) {
          const textElement = parent.querySelector('span, div, p');
          if (textElement && textElement !== element) {
            return textElement.textContent.trim();
          }
        }
      }
    ];
    
    for (const strategy of strategies) {
      try {
        const result = strategy();
        if (result && result.length > 0) return result;
      } catch (e) {
        // Continue to next strategy
      }
    }
    
    // Fallback to name or type
    return element.name || element.type || 'Field';
  }
  
  // SUBMIT BUTTON DETECTION
  function detectSubmitButtons() {
    console.log('🔍 Detecting submit buttons...');
    
    const submitSelectors = [
      // Google Forms submit buttons
      '.freebirdFormviewerViewNavigationSubmitButton',
      '.appsMaterialWizButtonPaperbuttonLabel:contains("Submit")',
      '[role="button"]:contains("Submit")',
      '.T2dutf', // Google Forms submit button class
      
      // Standard submit buttons
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Submit")',
      'button:contains("Send")',
      'button:contains("Save")',
      'button:contains("Continue")',
      'button:contains("Next")',
      '[role="button"]:contains("Submit")',
      'a.button:contains("Submit")',
      '.submit-button',
      '#submit',
      '[data-testid*="submit"]'
    ];
    
    const buttons = [];
    submitSelectors.forEach(selector => {
      try {
        const elements = selector.includes(':contains') 
          ? Array.from(document.querySelectorAll(selector.split(':contains')[0]))
              .filter(el => el.textContent.toLowerCase().includes(selector.match(/:contains\("(.+?)"\)/)[1].toLowerCase()))
          : document.querySelectorAll(selector);
          
        elements.forEach(el => {
          if (!buttons.includes(el)) {
            buttons.push(el);
            console.log('Found submit button:', el);
          }
        });
      } catch (e) {}
    });
    
    return buttons;
  }
  
  // SOLVE FORM WITH AI - Enhanced for all websites
  async function solveForm(apiKey) {
    try {
      // Add processing overlay
      addProcessingOverlay();
      showNotification('🔍 Analyzing page structure...', 'info');
      
      // Detect fields
      const fields = await detectAllFormFields();
      if (fields.length === 0) {
        removeProcessingOverlay();
        throw new Error('No form fields detected');
      }
      
      // Highlight detected fields
      highlightFields(fields);
      showNotification(`Found ${fields.length} fields, capturing page...`, 'info');
      
      // Take screenshot
      const screenshot = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'takeScreenshot' }, (response) => {
          resolve(response.screenshot);
        });
      });
      
      // Prepare enhanced data for AI
      const formDescription = fields.map(f => ({
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.options || [],
        placeholder: f.element?.placeholder || '',
        value: f.element?.value || '',
        name: f.name || ''
      }));
      
      // Call Gemini AI
      showNotification('🧠 AI is thinking...', 'info');
      const aiResponse = await callGemini(formDescription, screenshot, apiKey);
      
      // Fill form with visual feedback
      showNotification('✏️ Filling form fields...', 'info');
      await fillForm(aiResponse, fields);
      
      // Increment forms processed
      chrome.runtime.sendMessage({ action: 'incrementFormsProcessed' });
      
      removeProcessingOverlay();
      showNotification('✅ Form solved successfully!', 'success');
      
      // Check for learned submit buttons
      autoSubmitIfLearned();
      
      return { success: true };
      
    } catch (error) {
      console.error('Error solving form:', error);
      removeProcessingOverlay();
      showNotification(`❌ Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }
  
  // Add processing overlay
  function addProcessingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ai-form-processing-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(2px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 80px;
      height: 80px;
      border: 8px solid rgba(255, 255, 255, 0.3);
      border-top: 8px solid #4CAF50;
      border-radius: 50%;
      animation: ai-spin 1s linear infinite;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ai-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    overlay.appendChild(style);
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
  }
  
  // Remove processing overlay
  function removeProcessingOverlay() {
    const overlay = document.getElementById('ai-form-processing-overlay');
    if (overlay) overlay.remove();
  }
  
  // Auto submit if learned
  function autoSubmitIfLearned() {
    chrome.storage.sync.get(['learnedButtons', 'formsProcessed'], (result) => {
      if (result.formsProcessed >= 3 && result.learnedButtons && result.learnedButtons.length > 0) {
        // Try to find and highlight submit button
        if (result.learnedButtons && result.learnedButtons.length > 0) {
          const submitButton = document.querySelector(result.learnedButtons[0]);
          if (submitButton) {
            submitButton.style.outline = '3px solid #4CAF50';
            submitButton.style.outlineOffset = '3px';
            submitButton.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
            showNotification('✅ Submit button ready (learned from previous forms)', 'success');
          }
        }
      }
    });
  }
  

  
  // Call Gemini API
  async function callGemini(formFields, screenshot, apiKey) {
    const actualKey = (apiKey || window.CONFIG?.GEMINI_API_KEY || '').trim();
    
    console.log('Gemini API Key length:', actualKey.length);
    console.log('Gemini API Key starts with:', actualKey.substring(0, 10) + '...');
    
    if (!actualKey || actualKey === '') {
      throw new Error('Gemini API key is required. Please add your API key in the extension popup.');
    }
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${actualKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `You are helping to complete an online form. Based on the form fields provided, generate appropriate responses.

FORM FIELDS:
${JSON.stringify(formFields, null, 2)}

For each field, provide an appropriate response following these guidelines:
- Text fields: Use relevant, realistic responses
- Radio buttons: Select ONE option (just the text, not the letter)
- Checkboxes: Select appropriate options (as an array)
- For questions with factual answers, provide the correct answer
- For open-ended questions, provide brief, relevant responses

RESPONSE FORMAT:
Return ONLY a valid JSON array. Each object must have:
- "label": the field label
- "value": for radio buttons, just the answer text (e.g., "Jupiter" not "B) Jupiter")

Example: [{"label": "Name", "value": "Alex Johnson"}]` },
            { 
              inline_data: {
                mime_type: 'image/jpeg',
                data: screenshot.split(',')[1]
              }
            }
          ]
        }]
      })
    });
    
    const data = await response.json();
    
    // Check for API errors
    if (!response.ok || data.error) {
      console.error('Gemini API Error:', data);
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid Gemini API key. Please check your key and try again.');
      } else if (data.error?.message) {
        throw new Error(`Gemini API: ${data.error.message}`);
      } else if (data.error) {
        throw new Error(`Gemini API: ${JSON.stringify(data.error)}`);
      } else {
        throw new Error(`Gemini API request failed (${response.status})`);
      }
    }
    
    // Check for valid response structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || 
        !data.candidates[0].content.parts || !data.candidates[0].content.parts[0] || 
        !data.candidates[0].content.parts[0].text) {
      throw new Error('Invalid response from Gemini API');
    }
    
    try {
      let content = data.candidates[0].content.parts[0].text;
      // Remove markdown code blocks if present
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      } else if (content.includes('```')) {
        content = content.replace(/```\s*/g, '').trim();
      }
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse Gemini response:', data.candidates[0].content.parts[0].text);
      throw new Error('Failed to parse Gemini response: ' + e.message);
    }
  }
  
  // Fill form with AI responses
  async function fillForm(aiResponses, fields) {
    for (const response of aiResponses) {
      const field = fields.find(f => 
        f.label.toLowerCase().includes(response.label.toLowerCase()) ||
        response.label.toLowerCase().includes(f.label.toLowerCase())
      );
      
      if (!field) continue;
      
      if (field.googleForm) {
        await fillGoogleFormField(field, response.value);
      } else {
        await fillStandardField(field, response.value);
      }
      
      // Small delay between fields
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Fill Google Forms field
  async function fillGoogleFormField(field, value) {
    console.log(`Filling Google Form field: ${field.label} with ${typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value}`);
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'textarea':
        const input = field.element;
        const valueStr = String(value);
        
        console.log('🎯 GOOGLE FORMS TEXT FILL - Starting...');
        
        // Step 1: Focus the input
        input.focus();
        input.click();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 2: Clear any existing content
        input.select();
        document.execCommand('delete');
        input.value = '';
        
        // Step 3: Set the value using multiple methods
        // Method A: Direct assignment
        input.value = valueStr;
        
        // Method B: Native property setter (critical for Google Forms)
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        if (nativeSetter) {
          nativeSetter.call(input, valueStr);
        }
        
        // Method C: Try insertText if available
        try {
          input.select();
          const success = document.execCommand('insertText', false, valueStr);
          console.log('📝 insertText success:', success);
        } catch (e) {
          console.log('📝 insertText not available');
        }
        
        // Step 4: Fire events that Google Forms needs
        input.dispatchEvent(new InputEvent('input', { 
          bubbles: true, 
          composed: true,
          inputType: 'insertText',
          data: valueStr 
        }));
        
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Step 5: Wait and verify
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log(`🔍 Verification - Expected: "${valueStr}" (${valueStr.length} chars)`);
        console.log(`🔍 Verification - Actual: "${input.value}" (${input.value.length} chars)`);
        
        if (input.value === valueStr) {
          console.log('✅ Text fill SUCCESS!');
        } else {
          console.log('❌ Text fill FAILED - will try one more time');
          
          // One final attempt with different approach
          input.focus();
          input.value = '';
          
          // Type character by character as absolute last resort
          for (let i = 0; i < valueStr.length; i++) {
            const char = valueStr[i];
            input.value += char;
            
            // Fire input event after each character
            input.dispatchEvent(new InputEvent('input', { 
              bubbles: true,
              composed: true,
              inputType: 'insertText',
              data: char
            }));
            
            // Small delay every 10 characters
            if (i % 10 === 0 && i > 0) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          // Final change event
          input.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise(resolve => setTimeout(resolve, 200));
          
          console.log(`🔍 Final check - Got: "${input.value}" (${input.value.length} chars)`);
        }
        
        input.blur();
        break;
        
      case 'radio_group':
        // Handle case where checkboxes were misidentified as radio buttons
        const radioValueStr = String(value);
        if (radioValueStr.includes(',')) {
          console.log('⚠️ Multiple values detected for radio group - this might be a checkbox group');
          // Try to select the first value only
          const firstValue = radioValueStr.split(',')[0].trim();
          await fillGoogleFormField(field, firstValue);
          return;
        }
        
        // Find all clickable elements in the radio group
        const radioContainers = field.element.querySelectorAll(`
          .docssharedWizToggleLabeledContainer,
          .freebirdFormviewerComponentsQuestionRadioChoice,
          .nWQGrd,
          label[for]
        `);
        
        console.log(`Looking for radio option: "${radioValueStr}" among ${radioContainers.length} containers`);
        
        // Look for the text in the container and click the associated radio
        for (const container of radioContainers) {
          const optionText = container.textContent.trim();
          console.log(`Checking container option: "${optionText}"`);
          
          // Remove letter prefixes like "A) " or "B) "
          const cleanValue = radioValueStr.replace(/^[A-Z]\)\s*/, '');
          const cleanOption = optionText.replace(/^[A-Z]\)\s*/, '');
          
          if (cleanOption === cleanValue || cleanOption.toLowerCase() === cleanValue.toLowerCase() ||
              optionText === radioValueStr || optionText.toLowerCase() === radioValueStr.toLowerCase()) {
            console.log(`Match found! Clicking option: "${optionText}"`);
            
            // Find and click the radio button within this container
            const radio = container.querySelector('[role="radio"]') || 
                         container.querySelector('input[type="radio"]') ||
                         container;
            radio.click();
            return;
          }
        }
        break;
        
      case 'checkbox_group':
        // Find all checkbox containers
        const checkContainers = field.element.querySelectorAll(`
          .docssharedWizToggleLabeledContainer,
          .freebirdFormviewerComponentsQuestionCheckboxChoice,
          .nWQGrd,
          label[for]
        `);
        
        // Handle comma-separated string or array
        let valuesToCheck;
        if (Array.isArray(value)) {
          valuesToCheck = value;
        } else if (typeof value === 'string' && value.includes(',')) {
          valuesToCheck = value.split(',').map(v => v.trim());
        } else {
          valuesToCheck = [value];
        }
        
        console.log(`Looking for checkbox options: ${valuesToCheck.join(', ')} among ${checkContainers.length} containers`);
        
        for (const container of checkContainers) {
          const optionText = container.textContent.trim();
          
          for (const val of valuesToCheck) {
            // Remove letter prefixes and check for match
            const valStr = String(val); // Ensure it's a string
            const cleanValue = valStr.replace(/^[A-Z]\)\s*/, '');
            const cleanOption = optionText.replace(/^[A-Z]\)\s*/, '');
            
            if (cleanOption === cleanValue || cleanOption.toLowerCase() === cleanValue.toLowerCase() ||
                optionText.toLowerCase().includes(valStr.toLowerCase())) {
              console.log(`Checkbox match found! Clicking: "${optionText}"`);
              
              // Find and click the checkbox within this container
              const checkbox = container.querySelector('[role="checkbox"]') || 
                             container.querySelector('input[type="checkbox"]') ||
                             container;
              checkbox.click();
              break;
            }
          }
        }
        break;
        
      case 'dropdown':
        field.element.click();
        await new Promise(resolve => setTimeout(resolve, 200));
        const options = document.querySelectorAll('[role="option"]');
        for (const option of options) {
          if (option.textContent.toLowerCase().includes(value.toLowerCase())) {
            option.click();
            break;
          }
        }
        break;
    }
  }
  
  // Fill standard form field
  async function fillStandardField(field, value) {
    const element = field.element;
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'number':
      case 'url':
      case 'search':
        element.focus();
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        break;
        
      case 'textarea':
        element.focus();
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        break;
        
      case 'select':
        const options = Array.from(element.options);
        for (const option of options) {
          if (option.text.toLowerCase().includes(value.toLowerCase())) {
            element.value = option.value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
        break;
        
      case 'radio':
        const radios = document.getElementsByName(element.name);
        for (const radio of radios) {
          const label = getFieldLabel(radio);
          if (label.toLowerCase().includes(value.toLowerCase())) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
        break;
        
      case 'checkbox':
        element.checked = value === true || value === 'true' || value === 'yes';
        element.dispatchEvent(new Event('change', { bubbles: true }));
        break;
    }
  }
  
  // VISUAL FEEDBACK
  function highlightFields(fields) {
    // Remove old highlights
    document.querySelectorAll('.ai-form-highlight').forEach(el => {
      el.classList.remove('ai-form-highlight');
    });
    
    // Add new highlights
    fields.forEach(field => {
      if (field.element) {
        field.element.classList.add('ai-form-highlight');
      }
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
      document.querySelectorAll('.ai-form-highlight').forEach(el => {
        el.classList.remove('ai-form-highlight');
      });
    }, 3000);
  }
  
  // Send submit pattern to backend for learning
  async function sendSubmitPatternToBackend(pattern) {
    try {
      const response = await fetch('https://form-solver-ai-alexkkork123.replit.app/api/submit-patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pattern)
      });
      
      if (response.ok) {
        console.log('Submit pattern sent to backend for learning');
      } else {
        console.error('Failed to send submit pattern:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending submit pattern:', error);
      // Don't notify user about backend errors, just log them
    }
  }

  // LEARNING MODE
  function startLearningMode() {
    if (isLearningMode) {
      console.log('Learning mode already active');
      return;
    }
    
    isLearningMode = true;
    showNotification('🎯 Click on the submit button to teach me!', 'info');
    
    const learnClick = function(e) {
      if (!isLearningMode) return; // Exit if not in learning mode anymore
      
      const element = e.target;
      
      // Check if it looks like a submit button
      const isSubmit = element.tagName === 'BUTTON' || 
                      element.type === 'submit' ||
                      (element.textContent && element.textContent.toLowerCase().includes('submit')) ||
                      (element.textContent && element.textContent.toLowerCase().includes('send'));
      
      if (isSubmit) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Learned submit button:', element);
        
        // Store button info locally only (no backend to avoid CORS)
        const selector = getElementSelector(element);
        const buttonInfo = {
          selector: selector,
          text: element.textContent || '',
          url: window.location.hostname,
          timestamp: Date.now()
        };
        
        // Store with size limit to prevent quota exceeded
        chrome.storage.local.get(['learnedButtons'], (result) => {
          const buttons = result.learnedButtons || [];
          // Keep only last 50 buttons to prevent storage overflow
          if (buttons.length >= 50) {
            buttons.splice(0, buttons.length - 49);
          }
          buttons.push(buttonInfo);
          chrome.storage.local.set({ learnedButtons: buttons });
        });
        
        showNotification('✅ Submit button learned!', 'success');
        
        // Clean exit from learning mode
        document.removeEventListener('click', learnClick, true);
        isLearningMode = false;
      }
    };
    
    document.addEventListener('click', learnClick, true);
    
    // Auto exit after 30 seconds to prevent infinite loop
    setTimeout(() => {
      if (isLearningMode) {
        document.removeEventListener('click', learnClick, true);
        isLearningMode = false;
        showNotification('Learning mode timed out', 'info');
      }
    }, 30000);
  }
  
  // Get unique selector for element
  function getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }
  
  // NOTIFICATIONS
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'ai-form-notification';
    notification.textContent = message;
    notification.dataset.type = type;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  console.log('✅ AI Form Solver loaded successfully!');
})();