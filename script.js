async function loadAppData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load app data:', error);
    return null;
  }
}

function updateClock() {
  const now = new Date();

  // Format time (e.g., 2:45 PM)
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  document.querySelector('.time-display').textContent = `${hours}:${minutes} ${ampm}`;

  // Format date (e.g., Tuesday, Oct 24)
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  document.querySelector('.date-display').textContent = now.toLocaleDateString('en-US', options);
}

function renderTVGuide(tvData) {
  const container = document.getElementById('tv-list');
  container.innerHTML = '';

  const sortedTV = [...tvData].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  sortedTV.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'tv-item' + (index === 0 ? ' active' : '');

    el.innerHTML = `
      <div class="tv-channel">${item.channel}</div>
      <div class="tv-details">
        <span class="tv-network">${item.network}</span>
        <span class="tv-show">${item.current_show}</span>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderDiscoverItems(items, type) {
  const container = document.getElementById('discover-list');
  container.innerHTML = '';

  const sortedItems = [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Display top 3 items to fit the screen
  const displayItems = sortedItems.slice(0, 3);

  displayItems.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'discover-item';
    el.style.animationDelay = `${index * 0.15}s`;

    if (type === 'restaurants') {
      el.innerHTML = `
        <img class="discover-image" src="${item.image}" alt="${item.name}">
        <div class="discover-info">
          <h4 class="discover-name">${item.name}</h4>
          <span class="discover-meta">${item.cuisine}</span>
          <span class="discover-rating-dist">${item.rating}</span>
        </div>
      `;
    } else {
      el.innerHTML = `
        <img class="discover-image" src="${item.image}" alt="${item.name}">
        <div class="discover-info">
          <h4 class="discover-name">${item.name}</h4>
          <span class="discover-meta">${item.distance}</span>
        </div>
      `;
    }

    container.appendChild(el);
  });
}

async function init() {
  const data = await loadAppData();
  if (!data) return;

  // Apply Settings & Styles
  const settings = data.sections.app_settings;
  document.documentElement.style.setProperty('--primary-color', settings.primary_color.value);
  document.documentElement.style.setProperty('--secondary-color', settings.secondary_color.value);
  document.documentElement.style.setProperty('--background-color', settings.background_color.value);
  document.documentElement.style.setProperty('--text-color', settings.text_color.value);

  // Background and Logo
  const bgLayer = document.querySelector('.background-layer');
  if (settings.background_image && settings.background_image.value) {
    bgLayer.style.backgroundImage = `url('${settings.background_image.value}')`;
  }

  if (settings.logo && settings.logo.value) {
    document.querySelector('.logo').src = settings.logo.value;
  } else {
    document.querySelector('.logo').style.display = 'none';
  }

  document.querySelector('.hotel-name').textContent = settings.hotel_name.value;

  // Clock
  updateClock();
  setInterval(updateClock, 60000);

  // Weather
  const weather = data.sections.weather;
  document.querySelector('.temp').textContent = `${weather.temperature.value}°`;
  document.querySelector('.condition').textContent = weather.condition.value;
  if (weather.icon && weather.icon.value) {
    document.querySelector('.weather-icon').src = weather.icon.value;
  } else {
    document.querySelector('.weather-icon').style.display = 'none';
  }

  // Welcome / Guest Info
  const guest = data.sections.guest_info;
  document.querySelector('.guest-name').textContent = guest.guest_name.value;
  document.querySelector('.room-number').textContent = `Room ${guest.room_number.value}`;
  document.querySelector('.welcome-message').textContent = guest.welcome_message.value;

  if (guest.loyalty_status && guest.loyalty_status.value) {
    document.querySelector('.loyalty-status').textContent = guest.loyalty_status.value;
  } else {
    document.querySelector('.loyalty-status').style.display = 'none';
  }

  // Room Service Promo
  const promo = data.sections.room_service_promo;
  document.querySelector('.rs-headline').textContent = promo.headline.value;
  document.querySelector('.rs-desc').textContent = promo.description.value;

  if (promo.image && promo.image.value) {
    document.querySelector('.rs-background').style.backgroundImage = `url('${promo.image.value}')`;
  }
  if (promo.qr_code && promo.qr_code.value) {
    document.querySelector('.rs-qr').src = promo.qr_code.value;
  } else {
    document.querySelector('.rs-qr').style.display = 'none';
  }

  // TV Guide
  const tvData = data.sections.tv_guide?.value || [];
  renderTVGuide(tvData);

  // Discover Rotation (Restaurants & Attractions)
  const restaurants = data.sections.restaurants?.value || [];
  const attractions = data.sections.attractions?.value || [];

  let showRestaurants = true;
  const discoverTitle = document.getElementById('discover-title');

  function rotateDiscover() {
    if (showRestaurants && restaurants.length > 0) {
      discoverTitle.textContent = 'Local Dining';
      renderDiscoverItems(restaurants, 'restaurants');
      showRestaurants = attractions.length === 0; // Don't flip if no attractions
    } else if (attractions.length > 0) {
      discoverTitle.textContent = 'Things To Do';
      renderDiscoverItems(attractions, 'attractions');
      showRestaurants = restaurants.length > 0; // Flip back if restaurants exist
    }
  }

  // Initial render
  rotateDiscover();

  // Rotate every 10 seconds
  if (restaurants.length > 0 && attractions.length > 0) {
    setInterval(rotateDiscover, 10000);
  }

  // Reveal App
  document.getElementById('app-container').classList.add('loaded');
}

init();