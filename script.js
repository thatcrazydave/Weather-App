// Weather Dashboard - Enhanced Version
const API_KEY = "fc6b1998a42765443384bc6b822ede8a"; // Consider using environment variables in production
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const POLLUTION_URL = "https://api.openweathermap.org/data/2.5/air_pollution";
const GEOCODING_URL = "https://api.openweathermap.org/geo/1.0/direct";
const MAX_RECENT_SEARCHES = 5;

// Weather classification thresholds
const TEMP_THRESHOLDS = {
  cold: 10,  // Below 10°C is cold
  hot: 25    // Above 25°C is hot
};

// DOM elements
const elements = {
  form: document.getElementById("weatherForm"),
  cityInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  weatherResult: document.getElementById("weatherResult"),
  loadingIndicator: document.getElementById("loadingIndicator"),
  cityDetails: document.getElementById("cityDetails"),
  cityDetailsContent: document.getElementById("cityDetailsContent"),
  closeDetailsBtn: document.getElementById("closeDetailsBtn"),
  mainContent: document.querySelector(".main-content"),
  recentSearchesList: document.getElementById("recentSearches"),
  resetButton: document.getElementById("resetDashboard"),
  detailsBtn: null, // Will be set dynamically
  toggleRecent: document.getElementById('toggleRecent'),
  recentSearchesContainer: document.getElementById('recentSearchesContainer'),
};

// Initialize the application
function initApp() {
  // Set up event listeners for form submission
  elements.form.addEventListener("submit", handleFormSubmit);
  
  // City details panel close button
  elements.closeDetailsBtn.addEventListener("click", () => {
    elements.cityDetails.style.display = "none";
  });
  
  // Load and display recent searches
  displayRecentSearches();
  
  // Add event delegation for recent searches list
  elements.recentSearchesList.addEventListener("click", (e) => {
    const cityItem = e.target.closest("li");
    if (cityItem) {
      const city = cityItem.dataset.city;
      if (city) {
        elements.cityInput.value = city;
        getWeather(city);
      }
    }
  });
  
  // Load last search if available
  loadLastSearch();
  
  // Add reset button functionality
  elements.resetButton.addEventListener("click", resetDashboard);
  
  // Add hamburger menu toggle
  elements.toggleRecent.addEventListener('click', () => {
    elements.recentSearchesContainer.classList.toggle('active');
  });
  
  // Close recent searches when clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.recentSearchesContainer.contains(e.target) && 
        !elements.toggleRecent.contains(e.target)) {
      elements.recentSearchesContainer.classList.remove('active');
    }
  });
}

// Add resize handler
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    elements.recentSearchesContainer.classList.remove('active');
  }
});

// Handle form submission
function handleFormSubmit(e) {
  e.preventDefault();
  const city = elements.cityInput.value.trim();
  
  if (!city) {
    showError("Please enter a city name");
    return;
  }
  
  // Show loading indicator
  setLoading(true);
  getWeather(city);
}

// Get weather data from API
async function getWeather(city) {
  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(
        response.status === 404 
          ? `City "${city}" not found. Please check the spelling and try again.` 
          : `Error: ${response.status} - ${response.statusText || "Unknown error"}`
      );
    }
    
    const data = await response.json();
    
    // Save to recent searches
    saveToRecentSearches(city);
    
    // Show weather data
    showWeather(data);
    
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

// Display weather information
function showWeather(data) {
  if (!elements.weatherResult) return;
  
  // Set weather theme based on conditions
  setWeatherTheme(data);
  
  const weatherHTML = `
    <div class="weather-container">
      <div class="weather-card main-weather">
        <div class="weather-header">
          <div class="location-info">
            <h2>${data.name}, ${data.sys.country}</h2>
            <span class="weather-time">${formatLocalTime(data.timezone)}</span>
          </div>
          <button class="details-btn" id="viewDetailsBtn">
            <i class="fas fa-info-circle"></i>
            <span>View Details</span>
            <div class="button-loader"></div>
          </button>
        </div>
        
        <div class="weather-body">
          <div class="primary-info">
            <div class="temperature-display">
              <span class="temp-value">${Math.round(data.main.temp)}°C</span>
              <span class="feels-like">Feels like ${Math.round(data.main.feels_like)}°C</span>
            </div>
            <div class="weather-icon-large">
              <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png" 
                   alt="${data.weather[0].description}">
              <span class="weather-description">${data.weather[0].description}</span>
            </div>
          </div>

          <div class="weather-stats-grid">
            <div class="stat-card">
              <i class="fas fa-temperature-high"></i>
              <div class="stat-info">
                <span class="stat-label">High/Low</span>
                <span class="stat-value">${Math.round(data.main.temp_max)}°/${Math.round(data.main.temp_min)}°</span>
              </div>
            </div>
            
            <div class="stat-card">
              <i class="fas fa-wind"></i>
              <div class="stat-info">
                <span class="stat-label">Wind Speed</span>
                <span class="stat-value">${(data.wind.speed * 3.6).toFixed(1)} km/h</span>
              </div>
            </div>

            <div class="stat-card">
              <i class="fas fa-tint"></i>
              <div class="stat-info">
                <span class="stat-label">Humidity</span>
                <span class="stat-value">${data.main.humidity}%</span>
              </div>
            </div>

            <div class="stat-card">
              <i class="fas fa-compress-alt"></i>
              <div class="stat-info">
                <span class="stat-label">Pressure</span>
                <span class="stat-value">${data.main.pressure} hPa</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sun-info">
          <div class="sun-card">
            <i class="fas fa-sunrise"></i>
            <div class="sun-details">
              <span class="sun-label">Sunrise</span>
              <span class="sun-time">${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}</span>
            </div>
          </div>
          <div class="sun-card">
            <i class="fas fa-sunset"></i>
            <div class="sun-details">
              <span class="sun-label">Sunset</span>
              <span class="sun-time">${new Date(data.sys.sunset * 1000).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  elements.weatherResult.innerHTML = weatherHTML;
  
  // Set up details button after rendering
  elements.detailsBtn = document.getElementById('viewDetailsBtn');
  elements.detailsBtn.addEventListener('click', async () => {
    const btn = elements.detailsBtn;
    
    // Prevent multiple clicks
    if (btn.classList.contains('loading')) return;
    
    // Add loading state
    btn.classList.add('loading');
    btn.querySelector('span').textContent = 'Loading...';
    
    await showCityDetails(data.name);
    
    // Reset button state
    btn.classList.remove('loading');
    btn.querySelector('span').textContent = 'View Details';
    
    // Smooth scroll to details panel on mobile
    if (window.innerWidth < 768) {
      elements.cityDetails.scrollIntoView({ behavior: 'smooth' });
    }
  });
  
  localStorage.setItem("lastCity", data.name);
}

// Show error message
function showError(message) {
  if (!elements.weatherResult) return;
  elements.weatherResult.innerHTML = `
    <div class="error-message">
      <p>⚠️ ${message}</p>
    </div>
  `;
}

// Set loading state
function setLoading(isLoading) {
  if (elements.loadingIndicator) {
    elements.loadingIndicator.style.display = isLoading ? "block" : "none";
  }
  
  if (elements.searchBtn) {
    elements.searchBtn.disabled = isLoading;
    elements.searchBtn.textContent = isLoading ? "Searching..." : "Search";
  }
}

// Load last searched city from localStorage
function loadLastSearch() {
  const lastCity = localStorage.getItem("lastCity");
  if (lastCity && elements.cityInput) {
    elements.cityInput.value = lastCity;
    getWeather(lastCity);
  }
}

// Set weather-based theme based on conditions
function setWeatherTheme(data) {
  const temp = data.main.temp;
  const weather = data.weather[0].main.toLowerCase();
  const mainContent = elements.mainContent;
  
  // First, remove all existing theme classes
  mainContent.classList.remove(
    'theme-cold', 'theme-hot', 
    'theme-clear', 'theme-clouds', 'theme-rain', 
    'theme-snow', 'theme-thunderstorm', 'theme-drizzle', 'theme-mist'
  );
  
  // Map OpenWeatherMap weather conditions to our theme classes
  const weatherMapping = {
    'clear': 'theme-clear',
    'clouds': 'theme-clouds',
    'rain': 'theme-rain',
    'snow': 'theme-snow',
    'thunderstorm': 'theme-thunderstorm',
    'drizzle': 'theme-drizzle',
    'mist': 'theme-mist',
    'fog': 'theme-mist',
    'haze': 'theme-mist'
  };
  
  // Add temperature-based theme
  if (temp < TEMP_THRESHOLDS.cold) {
    mainContent.classList.add('theme-cold');
  } else if (temp > TEMP_THRESHOLDS.hot) {
    mainContent.classList.add('theme-hot');
  }
  
  // Add weather-based theme
  const themeClass = weatherMapping[weather] || 'theme-clear';
  mainContent.classList.add(themeClass);
  
  // Adjust for day/night
  const icon = data.weather[0].icon;
  const isNight = icon.includes('n');
  
  // Add night/day theme
  mainContent.classList.remove('time-theme-day', 'time-theme-night');
  mainContent.classList.add(isNight ? 'time-theme-night' : 'time-theme-day');
}

// Save city to recent searches
function saveToRecentSearches(city) {
  // Get existing searches or initialize an empty array
  let recentSearches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
  
  // Remove the city if it already exists (to avoid duplicates)
  recentSearches = recentSearches.filter(item => item.toLowerCase() !== city.toLowerCase());
  
  // Add the new city at the beginning
  recentSearches.unshift(city);
  
  // Limit to MAX_RECENT_SEARCHES items
  recentSearches = recentSearches.slice(0, MAX_RECENT_SEARCHES);
  
  // Save back to localStorage
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  
  // Update the UI
  displayRecentSearches();
}

// Display recent searches in the sidebar
function displayRecentSearches() {
  const recentSearches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
  
  if (recentSearches.length === 0) {
    elements.recentSearchesList.innerHTML = `<li class="no-searches">No recent searches</li>`;
    return;
  }
  
  const searchesHTML = recentSearches.map(city => `
    <li data-city="${city}">
      <span>${city}</span>
      <i class="fas fa-history"></i>
    </li>
  `).join("");
  
  elements.recentSearchesList.innerHTML = searchesHTML;
}

// Fetch detailed city information
async function fetchCityDetails(city) {
  try {
    const response = await fetch(
      `${FORECAST_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching forecast: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching city details:', error);
    return null;
  }
}

// Fetch extended city information
async function fetchExtendedCityDetails(cityName) {
  try {
    // Get coordinates first
    const geoResponse = await fetch(
      `${GEOCODING_URL}?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`
    );
    const geoData = await geoResponse.json();
    
    if (!geoData.length) {
      throw new Error('City coordinates not found');
    }
    
    const { lat, lon } = geoData[0];
    
    // Fetch air pollution data
    const pollutionResponse = await fetch(
      `${POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    const pollutionData = await pollutionResponse.json();
    
    return {
      coordinates: { lat, lon },
      airQuality: pollutionData.list[0].components,
      aqi: pollutionData.list[0].main.aqi
    };
  } catch (error) {
    console.error('Error fetching extended city details:', error);
    return null;
  }
}

// Add these helper functions before showCityDetails
function getAQIDescription(aqi) {
  const levels = {
    1: 'Good',
    2: 'Fair',
    3: 'Moderate',
    4: 'Poor',
    5: 'Very Poor'
  };
  return levels[aqi] || 'Unknown';
}

function formatLocalTime(timezone) {
  const localTime = new Date(Date.now() + timezone * 1000);
  return localTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

// Show detailed city information in side panel
async function showCityDetails(cityName) {
  elements.cityDetails.classList.add('loading');
  elements.cityDetails.style.display = 'block';
  
  elements.cityDetailsContent.innerHTML = `
    <div class="loading-container">
      <div class="loader"></div>
      <p>Loading city data...</p>
    </div>
  `;
  
  // Fetch both regular and extended data
  const [detailedData, extendedData] = await Promise.all([
    fetchCityDetails(cityName),
    fetchExtendedCityDetails(cityName)
  ]);
  
  if (detailedData) {
    const airQualityHTML = extendedData ? `
      <div class="detail-section">
        <h4><i class="fas fa-wind"></i> Air Quality</h4>
        <div class="air-quality-grid">
          <div class="air-quality-item">
            <span>Air Quality Index</span>
            <span class="aqi-level-${extendedData.aqi}">${getAQIDescription(extendedData.aqi)}</span>
          </div>
          <div class="air-quality-item">
            <span>CO</span>
            <span>${extendedData.airQuality.co} μg/m³</span>
          </div>
          <div class="air-quality-item">
            <span>NO₂</span>
            <span>${extendedData.airQuality.no2} μg/m³</span>
          </div>
          <div class="air-quality-item">
            <span>O₃</span>
            <span>${extendedData.airQuality.o3} μg/m³</span>
          </div>
          <div class="air-quality-item">
            <span>PM2.5</span>
            <span>${extendedData.airQuality.pm2_5} μg/m³</span>
          </div>
          <div class="air-quality-item">
            <span>PM10</span>
            <span>${extendedData.airQuality.pm10} μg/m³</span>
          </div>
        </div>
      </div>
    ` : '';

    const detailsHTML = `
      <div class="city-details-content">
        <h3>Detailed Information for ${cityName}</h3>
        
        <div class="detail-section">
          <h4><i class="fas fa-calendar-alt"></i> 5-Day Forecast</h4>
          <div class="forecast-grid">
            ${generateForecastHTML(detailedData.list)}
          </div>
        </div>
        
        ${airQualityHTML}
        
        <div class="detail-section">
          <h4><i class="fas fa-info-circle"></i> City Information</h4>
          <ul class="details-list">
            <li>
              <span>Population</span>
              <span>${formatPopulation(detailedData.city.population || 'N/A')}</span>
            </li>
            <li>
              <span>Timezone</span>
              <span>GMT ${formatTimezone(detailedData.city.timezone)}</span>
            </li>
            <li>
              <span>Coordinates</span>
              <span>${detailedData.city.coord.lat.toFixed(2)}°N, ${detailedData.city.coord.lon.toFixed(2)}°E</span>
            </li>
            <li>
              <span>Country</span>
              <span>${detailedData.city.country}</span>
            </li>
            <li>
              <span>Local Time</span>
              <span>${formatLocalTime(detailedData.city.timezone)}</span>
            </li>
          </ul>
        </div>
      </div>
    `;
    
    elements.cityDetailsContent.innerHTML = detailsHTML;
  } else {
    elements.cityDetailsContent.innerHTML = `
      <div class="error-message">
        <p>⚠️ Unable to load data for ${cityName}</p>
      </div>
    `;
  }
  
  elements.cityDetails.classList.remove('loading');
}

// Generate HTML for 5-day forecast
function generateForecastHTML(forecastList) {
  // Group forecast by day (using date as the key)
  const forecastByDay = {};
  
  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    if (!forecastByDay[date]) {
      forecastByDay[date] = {
        date: date,
        icon: item.weather[0].icon,
        description: item.weather[0].description,
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_min,
        tempAvg: item.main.temp,
        humidity: item.main.humidity,
        count: 1
      };
    } else {
      const day = forecastByDay[date];
      day.tempMin = Math.min(day.tempMin, item.main.temp_min);
      day.tempMax = Math.max(day.tempMax, item.main.temp_max);
      day.tempAvg = (day.tempAvg * day.count + item.main.temp) / (day.count + 1);
      day.humidity = (day.humidity * day.count + item.main.humidity) / (day.count + 1);
      day.count++;
      
      // Update icon to prefer daytime icons
      if (item.weather[0].icon.includes('d')) {
        day.icon = item.weather[0].icon;
        day.description = item.weather[0].description;
      }
    }
  });
  
  // Convert the object to an array and take the first 5 days
  const dailyForecast = Object.values(forecastByDay).slice(0, 5);
  
  // Generate HTML for each day
  return dailyForecast.map(day => `
    <div class="forecast-day">
      <div class="forecast-date">${day.date}</div>
      <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
      <div class="forecast-temp">${Math.round(day.tempAvg)}°C</div>
      <div class="forecast-minmax">
        <span>${Math.round(day.tempMin)}°</span>
        <span>/</span>
        <span>${Math.round(day.tempMax)}°</span>
      </div>
      <div class="forecast-desc">${day.description}</div>
    </div>
  `).join('');
}

// Format population with commas for thousands
function formatPopulation(population) {
  if (population === 'N/A') return 'N/A';
  return population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format timezone offset
function formatTimezone(seconds) {
  const hours = seconds / 3600;
  const sign = hours >= 0 ? '+' : '';
  return `${sign}${hours.toFixed(1)}`;
}

// Reset the dashboard
function resetDashboard() {
  // Clear input
  elements.cityInput.value = '';
  
  // Reset weather display to welcome message
  elements.weatherResult.innerHTML = `
    <div class="welcome-message">
      <i class="fas fa-cloud-sun fa-4x"></i>
      <h2>Welcome to Weather Dashboard</h2>
      <p>Search for a city to see detailed weather information</p>
    </div>
  `;
  
  // Hide city details panel if open
  elements.cityDetails.style.display = 'none';
  
  // Remove any active weather themes
  elements.mainContent.className = 'main-content';
  
  // Clear loading state if active
  setLoading(false);
}

// Initialize the app when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

// Expose functions for external use (e.g., for inline onclick handlers)
window.showCityDetails = showCityDetails;