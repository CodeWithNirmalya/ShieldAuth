document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // DOM Elements
    // ---------------------------------------------------------
    const passwordInput = document.getElementById('password-input');
    const toggleVisibilityBtn = document.getElementById('toggle-visibility');
    const eyeIcon = toggleVisibilityBtn.querySelector('.eye-icon');
    const eyeOffIcon = toggleVisibilityBtn.querySelector('.eye-off-icon');

    const strengthVal = document.getElementById('strength-val');
    const scoreVal = document.getElementById('score-val');
    const strengthBar = document.getElementById('strength-bar');
    
    const entropyVal = document.getElementById('entropy-val');
    const crackTimeVal = document.getElementById('crack-time-val');
    
    const chkLowercase = document.getElementById('chk-lowercase');
    const chkUppercase = document.getElementById('chk-uppercase');
    const chkDigits = document.getElementById('chk-digits');
    const chkSpecial = document.getElementById('chk-special');
    const chkPatterns = document.getElementById('chk-patterns');
    
    const suggestionsBox = document.getElementById('suggestions-box');
    const suggestionsList = document.getElementById('suggestions-list');

    // Generator Elements
    const generatedPasswordInput = document.getElementById('generated-password');
    const copyBtn = document.getElementById('copy-btn');
    const copyIcon = copyBtn.querySelector('.copy-icon');
    const copiedIcon = copyBtn.querySelector('.copied-icon');
    
    const lengthSlider = document.getElementById('length-slider');
    const lengthVal = document.getElementById('length-val');
    
    const genUppercase = document.getElementById('gen-uppercase');
    const genLowercase = document.getElementById('gen-lowercase');
    const genNumbers = document.getElementById('gen-numbers');
    const genSymbols = document.getElementById('gen-symbols');
    const generateBtn = document.getElementById('generate-btn');

    // Cards for Hover Glow Effect
    const cards = document.querySelectorAll('.card');

    // ---------------------------------------------------------
    // Card Glow Effect (3D Light Tracking)
    // ---------------------------------------------------------
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
        });
    });

    // ---------------------------------------------------------
    // Password Visibility Toggle
    // ---------------------------------------------------------
    toggleVisibilityBtn.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        eyeIcon.classList.toggle('hidden', isPassword);
        eyeOffIcon.classList.toggle('hidden', !isPassword);
    });

    // ---------------------------------------------------------
    // Real-Time Analysis API Integration
    // ---------------------------------------------------------
    let debounceTimer;

    const resetUI = () => {
        strengthVal.textContent = 'Weak';
        strengthVal.className = 'weak';
        scoreVal.textContent = '0/100';
        scoreVal.className = '';
        
        strengthBar.style.width = '0%';
        strengthBar.className = 'meter-bar';
        
        entropyVal.innerHTML = '0.00 <span class="unit">bits</span>';
        crackTimeVal.textContent = 'instant';
        
        [chkLowercase, chkUppercase, chkDigits, chkSpecial].forEach(chk => {
            chk.className = 'unchecked';
        });
        chkPatterns.className = 'checked'; // Default to checked (no patterns yet)
        
        suggestionsBox.classList.add('hidden');
        suggestionsList.innerHTML = '';
    };

    const analyzePassword = async (password) => {
        if (!password) {
            resetUI();
            return;
        }

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                throw new Error('Analysis failed server-side');
            }

            const data = await response.json();
            updateUI(data);
        } catch (error) {
            console.error('API Error:', error);
            // Fallback to local basic calculation if backend is temporarily unreachable
            localFallbackAnalysis(password);
        }
    };

    const updateUI = (data) => {
        // Update strength label and classes
        const strengthClass = data.strength.toLowerCase().replace(' ', '-');
        strengthVal.textContent = data.strength;
        strengthVal.className = strengthClass;

        scoreVal.textContent = `${data.score}/100`;
        scoreVal.className = strengthClass;

        // Update meter bar width and class
        strengthBar.style.width = `${data.score}%`;
        strengthBar.className = `meter-bar bg-${strengthClass}`;

        // Update tiles
        entropyVal.innerHTML = `${data.entropy.toFixed(2)} <span class="unit">bits</span>`;
        crackTimeVal.textContent = data.crack_time_formatted;

        // Update Checklist
        updateChecklist(data.types, data.patterns);

        // Update Suggestions
        if (data.suggestions && data.suggestions.length > 0) {
            suggestionsBox.classList.remove('hidden');
            suggestionsList.innerHTML = data.suggestions
                .map(s => `<li>${s}</li>`)
                .join('');
        } else {
            suggestionsBox.classList.add('hidden');
            suggestionsList.innerHTML = '';
        }
    };

    const updateChecklist = (types, patterns) => {
        chkLowercase.className = types.lowercase ? 'checked' : 'unchecked';
        chkUppercase.className = types.uppercase ? 'checked' : 'unchecked';
        chkDigits.className = types.digits ? 'checked' : 'unchecked';
        chkSpecial.className = types.special ? 'checked' : 'unchecked';
        
        // Checklist is checked (No Patterns) if patterns list is empty
        chkPatterns.className = (patterns && patterns.length === 0) ? 'checked' : 'unchecked';
    };

    // Input Event Listener with Debounce (150ms)
    passwordInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const val = e.target.value;
        if (!val) {
            resetUI();
            return;
        }
        debounceTimer = setTimeout(() => {
            analyzePassword(val);
        }, 150);
    });

    // ---------------------------------------------------------
    // Password Generator Logic
    // ---------------------------------------------------------
    lengthSlider.addEventListener('input', (e) => {
        lengthVal.textContent = e.target.value;
    });

    const generatePassword = () => {
        const length = parseInt(lengthSlider.value, 10);
        const includeUpper = genUppercase.checked;
        const includeLower = genLowercase.checked;
        const includeNumber = genNumbers.checked;
        const includeSymbol = genSymbols.checked;

        const charSets = {
            upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lower: 'abcdefghijklmnopqrstuvwxyz',
            number: '0123456789',
            symbol: '!@#$%^&*(),.?":{}|<>'
        };

        let activePool = '';
        let mandatoryChars = [];

        if (includeUpper) {
            activePool += charSets.upper;
            mandatoryChars.push(charSets.upper[Math.floor(Math.random() * charSets.upper.length)]);
        }
        if (includeLower) {
            activePool += charSets.lower;
            mandatoryChars.push(charSets.lower[Math.floor(Math.random() * charSets.lower.length)]);
        }
        if (includeNumber) {
            activePool += charSets.number;
            mandatoryChars.push(charSets.number[Math.floor(Math.random() * charSets.number.length)]);
        }
        if (includeSymbol) {
            activePool += charSets.symbol;
            mandatoryChars.push(charSets.symbol[Math.floor(Math.random() * charSets.symbol.length)]);
        }

        // Fallback: default to lowercase and numbers if nothing is selected
        if (activePool === '') {
            activePool = charSets.lower + charSets.number;
            mandatoryChars.push(charSets.lower[Math.floor(Math.random() * charSets.lower.length)]);
            mandatoryChars.push(charSets.number[Math.floor(Math.random() * charSets.number.length)]);
            genLowercase.checked = true;
            genNumbers.checked = true;
        }

        let password = [...mandatoryChars];
        const remainingLength = length - password.length;

        for (let i = 0; i < remainingLength; i++) {
            const randomIndex = Math.floor(Math.random() * activePool.length);
            password.push(activePool[randomIndex]);
        }

        // Shuffle the characters array to mix the mandatory characters
        password = password.sort(() => Math.random() - 0.5).join('');

        generatedPasswordInput.value = password;

        // Auto-fill input and run analyzer for dynamic premium feedback loop
        passwordInput.value = password;
        analyzePassword(password);
    };

    generateBtn.addEventListener('click', generatePassword);

    // ---------------------------------------------------------
    // Copy to Clipboard Action
    // ---------------------------------------------------------
    copyBtn.addEventListener('click', async () => {
        const textToCopy = generatedPasswordInput.value;
        if (!textToCopy) return;

        try {
            await navigator.clipboard.writeText(textToCopy);
            
            // Show Success UI State
            copyIcon.classList.add('hidden');
            copiedIcon.classList.remove('hidden');
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyIcon.classList.remove('hidden');
                copiedIcon.classList.add('hidden');
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard', err);
        }
    });

    // ---------------------------------------------------------
    // Local Fallback Password Analysis (if API offline)
    // ---------------------------------------------------------
    const localFallbackAnalysis = (password) => {
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const types = { lowercase: hasLower, uppercase: hasUpper, digits: hasDigit, special: hasSpecial };
        
        let charsetSize = 0;
        if (hasLower) charsetSize += 26;
        if (hasUpper) charsetSize += 26;
        if (hasDigit) charsetSize += 10;
        if (hasSpecial) charsetSize += 32;

        const entropy = charsetSize > 0 ? password.length * Math.log2(charsetSize) : 0;
        
        // Simplified scoring
        let score = Math.min(password.length * 4, 40);
        score += (hasLower ? 10 : 0) + (hasUpper ? 10 : 0) + (hasDigit ? 10 : 0) + (hasSpecial ? 10 : 0);
        if (password.length < 8) score = Math.max(0, score - 15);

        let strength = 'Weak';
        let colorClass = 'weak';
        if (score >= 80) { strength = 'Very Strong'; colorClass = 'very-strong'; }
        else if (score >= 60) { strength = 'Strong'; colorClass = 'strong'; }
        else if (score >= 30) { strength = 'Medium'; colorClass = 'medium'; }

        const mockData = {
            types,
            patterns: [],
            entropy,
            crack_time_formatted: 'calculating...',
            score,
            strength,
            suggestions: password.length < 12 ? ['Increase length to at least 12 characters'] : []
        };
        
        updateUI(mockData);
    };
});
