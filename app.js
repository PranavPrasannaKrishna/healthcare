document.addEventListener('DOMContentLoaded', () => {
  
  // =========================================================================
  // 1. Mobile Menu Toggle
  // =========================================================================
  const menuToggle = document.getElementById('menuToggle');
  const navbar = document.querySelector('.navbar');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      navbar.classList.toggle('mobile-active');
      
      // Toggle burger animation
      const spans = menuToggle.querySelectorAll('span');
      if (navbar.classList.contains('mobile-active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }

  // Close mobile menu on click links
  const navLinksList = document.querySelectorAll('.nav-links a');
  navLinksList.forEach(link => {
    link.addEventListener('click', () => {
      if (navbar.classList.contains('mobile-active')) {
        navbar.classList.remove('mobile-active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  });


  // =========================================================================
  // 2. Pricing Plan Switcher (Monthly vs Annual)
  // =========================================================================
  const billingToggle = document.getElementById('billingToggle');
  const priceBasic = document.getElementById('priceBasic');
  const pricePro = document.getElementById('pricePro');
  const periodBasic = document.getElementById('periodBasic');
  const periodPro = document.getElementById('periodPro');
  const labelMonthly = document.getElementById('labelMonthly');
  const labelAnnual = document.getElementById('labelAnnual');

  if (billingToggle) {
    billingToggle.addEventListener('change', () => {
      const isAnnual = billingToggle.checked;
      
      if (isAnnual) {
        // Annual pricing (approx 20% discount)
        priceBasic.textContent = '239';
        pricePro.textContent = '399';
        periodBasic.textContent = ' /mo (billed annually)';
        periodPro.textContent = ' /mo (billed annually)';
        labelAnnual.classList.add('active');
        labelMonthly.classList.remove('active');
      } else {
        // Monthly pricing
        priceBasic.textContent = '299';
        pricePro.textContent = '499';
        periodBasic.textContent = '/mo';
        periodPro.textContent = '/mo';
        labelMonthly.classList.add('active');
        labelAnnual.classList.remove('active');
      }
    });
  }


  // =========================================================================
  // 3. Lead Capture Form (LocalStorage + Dynamic Success State)
  // =========================================================================
  const leadForm = document.getElementById('leadForm');
  const successCard = document.getElementById('successCard');
  const registeredEmail = document.getElementById('registeredEmail');
  const resetBtn = document.getElementById('resetBtn');

  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submitBtn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Registering Family...';
      submitBtn.disabled = true;

      const name = document.getElementById('fullName').value;
      const email = document.getElementById('email').value;
      const relation = document.getElementById('relation').value;
      const phone = document.getElementById('phone').value;
      const parentCity = document.getElementById('parentCity').value;

      const caregiverData = { name, email, relation, phone, parentCity };

      // Save to localStorage as redundancy cache
      localStorage.setItem('healthbridges_lead', JSON.stringify({ ...caregiverData, date: new Date().toISOString() }));
      if (typeof window.saveLocalLeadToAll === 'function') {
        window.saveLocalLeadToAll(caregiverData);
      }

      // Google Sheets Apps Script Web App URL
      // (Replace this placeholder with your actual Google Script URL after deployment)
      const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzrMBa6FFyo_eJgKj2VfFTNPRlIPI2jf4LHjfdULrKhkStXE6Er3wzAX3KhgctwoVx-8A/exec';

      let signupUrl = GOOGLE_SHEETS_URL;
      let headers = { 'Content-Type': 'text/plain;charset=utf-8' }; // simple text/plain to bypass CORS preflights

      // Fallback to local server if Google Sheets URL is not configured
      if (!signupUrl || signupUrl.startsWith('YOUR_')) {
        const isLocalFile = window.location.protocol === 'file:';
        signupUrl = isLocalFile ? 'http://localhost:8080/api/signup' : '/api/signup';
        headers = { 'Content-Type': 'application/json' };
      }

      // POST request to save signup details
      fetch(signupUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(caregiverData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Registration failed');
        }
        return response.json();
      })
      .then(data => {
        registeredEmail.textContent = email;
        
        // Hide form and show success
        leadForm.classList.add('hidden');
        successCard.classList.remove('hidden');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Refresh leads view
        if (typeof loadLeads === 'function') {
          loadLeads();
        }
        
        // Smooth scroll to top of card
        document.getElementById('signup').scrollIntoView({ behavior: 'smooth' });
      })
      .catch(error => {
        console.warn('Submission network error, saving locally:', error);
        
        // Graceful offline fallback: complete transition and show locally saved info
        registeredEmail.textContent = email;
        leadForm.classList.add('hidden');
        successCard.classList.remove('hidden');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (typeof loadLeads === 'function') {
          loadLeads();
        }
        
        document.getElementById('signup').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      leadForm.reset();
      leadForm.classList.remove('hidden');
      successCard.classList.add('hidden');
    });
  }


  // =========================================================================
  // 4. WhatsApp Interactive Simulator & Live Dashboard Sync
  // =========================================================================
  const chatBtns = document.querySelectorAll('.chat-btn');
  const whatsappChat = document.getElementById('whatsappChat');
  
  // Dashboard DOM targets
  const adherenceVal = document.getElementById('adherenceVal');
  const adherenceBar = document.getElementById('adherenceBar');
  const vitalsVal = document.getElementById('vitalsVal');
  const vitalsStatus = document.getElementById('vitalsStatus');
  const dashboardTimeline = document.getElementById('dashboardTimeline');
  const healthSummaryText = document.getElementById('healthSummaryText');
  const mainDashboard = document.querySelector('.main-dashboard');
  const statusBadge = document.querySelector('.status-badge');

  let activeEmergencyAlert = null;

  chatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const userText = btn.textContent.replace(/['"“”]/g, ''); // strip quotes
      
      // Prevent rapid tapping on same action
      btn.disabled = true;
      setTimeout(() => btn.disabled = false, 1500);

      // Append User message to simulator
      appendChatMessage(userText, 'user');
      
      // Auto scroll chat to bottom
      scrollToBottom(whatsappChat);

      // Show typing indicator
      showTypingIndicator();

      // Trigger bot response and dashboard update
      setTimeout(() => {
        removeTypingIndicator();
        handleBotReaction(action);
      }, 1200);
    });
  });

  function appendChatMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `message ${sender === 'user' ? 'msg-user' : 'msg-system'}`;
    msg.textContent = text;
    whatsappChat.appendChild(msg);
  }

  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message msg-system typing-indicator';
    indicator.id = 'waTyping';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    
    // Custom typing style
    const style = document.createElement('style');
    style.id = 'typingStyle';
    style.innerHTML = `
      .typing-indicator span {
        display: inline-block;
        width: 6px;
        height: 6px;
        background-color: var(--text-muted);
        border-radius: 50%;
        margin-right: 3px;
        animation: typing 1s infinite alternate;
      }
      .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typing {
        from { transform: translateY(0); }
        to { transform: translateY(-5px); }
      }
    `;
    if (!document.getElementById('typingStyle')) {
      document.head.appendChild(style);
    }
    
    whatsappChat.appendChild(indicator);
    scrollToBottom(whatsappChat);
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('waTyping');
    if (indicator) {
      indicator.remove();
    }
  }

  function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
  }

  function handleBotReaction(action) {
    let botReply = '';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Clean up emergency alerts if normal logging happens
    if (action !== 'alert-sos' && activeEmergencyAlert) {
      clearEmergencyState();
    }

    switch(action) {
      case 'take-med':
        botReply = "Excellent! Logged evening Metformin (500mg) for Mr. Subramanian at " + nowTime + ". Parent Care Dashboard synced successfully.";
        appendChatMessage(botReply, 'system');
        
        // Update dashboard medication compliance
        adherenceVal.textContent = '96%';
        adherenceBar.style.width = '96%';
        
        // Find and complete the pending meds timeline item
        const pendingMeds = document.getElementById('pendingMeds');
        if (pendingMeds) {
          pendingMeds.className = 'timeline-item done';
          const timeSpan = pendingMeds.querySelector('.timeline-time');
          const textSpan = pendingMeds.querySelector('.timeline-text');
          timeSpan.textContent = nowTime;
          textSpan.textContent = 'Night dosage (Metformin 500mg) - Checked in via WhatsApp.';
        }
        break;

      case 'log-bp':
        botReply = "Received BP log. Subramanian's BP is 120/80 mmHg. Heart rate is 72 bpm. Status: Optimal. Log updated.";
        appendChatMessage(botReply, 'system');

        // Update dashboard Vitals values
        vitalsVal.innerHTML = '120/80 <span class="unit">mmHg</span>';
        vitalsStatus.textContent = 'BP logged just now (Optimal)';
        vitalsStatus.className = 'card-mini-desc text-green';

        // Add a new timeline event
        const bpItem = document.createElement('div');
        bpItem.className = 'timeline-item done';
        bpItem.innerHTML = `
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <span class="timeline-time">${nowTime}</span>
            <span class="timeline-text">Vitals update: Blood pressure logged at 120/80 (Optimal).</span>
          </div>
        `;
        dashboardTimeline.insertBefore(bpItem, dashboardTimeline.firstChild);
        break;

      case 'ask-doc':
        botReply = "Request sent to Dr. Reddy. A summary of Dad's daily logs has been sent to the clinic. You'll receive a clinic update within 2 hours.";
        appendChatMessage(botReply, 'system');

        // Update records panel
        healthSummaryText.innerHTML = `<strong>Clinic Escalation</strong>: Dr. Reddy notified at ${nowTime}. System uploaded logs. Patient record queue updated.`;
        break;

      case 'alert-sos':
        botReply = "⚠️ EMERGENCY TRIGGERED. Alerting NRI children on all active channels. Dialing Bangalore nearest ambulance center (Manipal Hospital). Care coordinator dispatched.";
        appendChatMessage(botReply, 'system');

        // Trigger visual alarm state on the Dashboard panel
        triggerEmergencyState(nowTime);
        break;
    }

    scrollToBottom(whatsappChat);
  }

  function triggerEmergencyState(timeStr) {
    if (activeEmergencyAlert) return;
    
    activeEmergencyAlert = true;
    
    // Change dashboard status
    statusBadge.textContent = 'EMERGENCY ACTIVE';
    statusBadge.className = 'status-badge btn-danger-pulse'; // red flashing badge
    statusBadge.style.backgroundColor = 'var(--danger)';
    statusBadge.style.color = 'white';

    // Add alarm banner to dashboard
    const alarmBanner = document.createElement('div');
    alarmBanner.id = 'alarmBanner';
    alarmBanner.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
    alarmBanner.style.border = '2px solid var(--danger)';
    alarmBanner.style.padding = '12px 18px';
    alarmBanner.style.borderRadius = '12px';
    alarmBanner.style.color = '#FCA5A5';
    alarmBanner.style.fontWeight = '700';
    alarmBanner.style.fontSize = '0.9rem';
    alarmBanner.style.marginBottom = '20px';
    alarmBanner.style.textAlign = 'center';
    alarmBanner.style.animation = 'pulseRed 1.5s infinite';
    alarmBanner.innerHTML = '⚠️ SOS TRIGGERED FROM WHATSAPP at ' + timeStr + ' · EMERGENCY SERVICES RESPONDING';

    mainDashboard.insertBefore(alarmBanner, mainDashboard.firstChild);
    
    // Add critical timeline item
    const emergencyTimeline = document.createElement('div');
    emergencyTimeline.id = 'emergencyTimelineItem';
    emergencyTimeline.className = 'timeline-item danger-state';
    emergencyTimeline.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <span class="timeline-time">${timeStr}</span>
        <span class="timeline-text" style="color:#EF4444; font-weight:700;">Critical Alert: Emergency button triggered by parent. Emergency response is active.</span>
      </div>
    `;
    dashboardTimeline.insertBefore(emergencyTimeline, dashboardTimeline.firstChild);
    
    // Border glow on dashboard card
    mainDashboard.style.border = '2px solid var(--danger)';
    mainDashboard.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.3)';
  }

  function clearEmergencyState() {
    activeEmergencyAlert = false;
    
    // Reset dashboard style
    mainDashboard.style.border = '1px solid var(--glass-border)';
    mainDashboard.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
    
    // Reset status badge
    statusBadge.textContent = 'Active Monitoring';
    statusBadge.className = 'status-badge status-online';
    statusBadge.style.backgroundColor = '';
    statusBadge.style.color = '';

    // Remove banner
    const banner = document.getElementById('alarmBanner');
    if (banner) banner.remove();

    // Remove emergency timeline item
    const emergencyTimeline = document.getElementById('emergencyTimelineItem');
    if (emergencyTimeline) emergencyTimeline.remove();
  }


  // =========================================================================
  // 5. Stat Counter Animations
  // =========================================================================
  const statNums = document.querySelectorAll('.stat-num');
  
  const animateStats = () => {
    statNums.forEach(stat => {
      const targetVal = parseInt(stat.getAttribute('data-val'));
      const textSuffix = stat.textContent.includes('M') ? 'M' : '%';
      let currentVal = 0;
      const duration = 1200; // Total duration in ms
      const stepTime = Math.abs(Math.floor(duration / targetVal));
      
      const timer = setInterval(() => {
        currentVal++;
        stat.textContent = currentVal + textSuffix;
        if (currentVal >= targetVal) {
          stat.textContent = targetVal + textSuffix;
          clearInterval(timer);
        }
      }, stepTime);
    });
  };

  // Intersection Observer to launch animation on scroll
  if ('IntersectionObserver' in window && statNums.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStats();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    // Observe the stats section
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
      observer.observe(statsSection);
    }
  } else {
    // Fallback if no observer support
    setTimeout(animateStats, 1000);
  }


  // =========================================================================
  // 6. IoT Pill Dispenser Interactive Mock
  // =========================================================================
  const dispenserDrawerBtn = document.getElementById('dispenserDrawerBtn');
  const dispenserLed = document.getElementById('dispenserLed');
  const lidStatus = document.getElementById('lidStatus');

  if (dispenserDrawerBtn) {
    // Make the button initially active to invite click
    setTimeout(() => {
      dispenserDrawerBtn.classList.add('active');
    }, 2000);

    dispenserDrawerBtn.addEventListener('click', () => {
      if (dispenserDrawerBtn.disabled) return;
      
      dispenserDrawerBtn.disabled = true;
      dispenserDrawerBtn.classList.remove('active');
      dispenserDrawerBtn.textContent = 'DISPENSING...';
      
      // Pulsing orange while dispensing
      dispenserLed.style.backgroundColor = 'var(--accent)';
      dispenserLed.style.boxShadow = '0 0 15px var(--accent)';
      
      setTimeout(() => {
        // Dispense logged, drawer opened
        lidStatus.textContent = 'Open (Dispensed)';
        lidStatus.className = 'metric-val text-yellow';
        
        dispenserDrawerBtn.textContent = 'DRAWER OPEN';
        
        // Wait for parent to close the lid/drawer
        setTimeout(() => {
          lidStatus.textContent = 'Closed';
          lidStatus.className = 'metric-val text-green';
          dispenserDrawerBtn.textContent = 'PUSH TO DISPENSE';
          dispenserLed.style.backgroundColor = 'var(--primary)';
          dispenserLed.style.boxShadow = '0 0 10px var(--primary)';
          dispenserDrawerBtn.disabled = false;
          dispenserDrawerBtn.classList.add('active');

          // Log in the central caregiver dashboard
          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const iotItem = document.createElement('div');
          iotItem.className = 'timeline-item done';
          iotItem.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <span class="timeline-time">${nowTime}</span>
              <span class="timeline-text">⚡ IoT Pill Dispenser: Metformin dispensed & drawer confirmed closed.</span>
            </div>
          `;
          dashboardTimeline.insertBefore(iotItem, dashboardTimeline.firstChild);
        }, 3000);
      }, 1500);
    });
  }

});
