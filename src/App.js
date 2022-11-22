import { useEffect, useState } from 'react';
import './App.css';
import { useFetch } from './Hooks/useFetch';
import DailyForecast from './Components/DailyForecast';
import HourlyForecast from './Components/HourlyForecast';
import Navbar from './Components/Navbar';
import MainWeatherCard from './Components/MainWeatherCard';
import Box from './Components/RequiredThings/Box';
import Loader from './Components/Loader';
import MapContainer from './Components/Map';
import PlaylistRecommendation from './Components/PlaylistRecommendation';

function App() {
	const [city, setCity] = useState('New York City');
	const [cWeatherUrl, setCWeatherUrl] = useState(
		`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.REACT_APP_APIKEY}`,
	);
	const [forecastUrl, setForecastUrl] = useState(
		`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${process.env.REACT_APP_APIKEY}`,
	);
	const [forecastDataGrouped, setForecastDataGrouped] = useState(null);
	const [activeWeatherCard, setActiveWeatherCard] = useState(0);
	let timer,
		timeoutVal = 1000;
	const updateUrls = (city) => {
		setCWeatherUrl(
			`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.REACT_APP_APIKEY}`,
		);
		setForecastUrl(
			`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${process.env.REACT_APP_APIKEY}`,
		);
	};
	let { data: cWeatherData, error: cWeatherError, loading: cWeatherLoading } = useFetch(cWeatherUrl);
	let { data: forecastData, error: forecastError, loading: forecastLoading } = useFetch(forecastUrl);

	const handleKeyDown = () => {
		window.clearTimeout(timer);
	};
	const handleKeyUp = (e) => {
		if (city) {
			window.clearTimeout(timer);
			timer = window.setTimeout(() => {
				updateUrls(city);
			}, timeoutVal);
		}
	};
	const findLocation = () => {
		navigator.geolocation.getCurrentPosition((position) => {
			setCWeatherUrl(
				'https://api.openweathermap.org/data/2.5/weather?lat=' +
					position.coords.latitude +
					'&lon=' +
					position.coords.longitude +
					'&units=metric&appid=' +
					process.env.REACT_APP_APIKEY,
			);

			setForecastUrl(
				'https://api.openweathermap.org/data/2.5/forecast?lat=' +
					position.coords.latitude +
					'&lon=' +
					position.coords.longitude +
					'&units=metric&appid=' +
					process.env.REACT_APP_APIKEY,
			);
		});
	};

	useEffect(() => {
		if (navigator.geolocation) {
			findLocation();
		} else {
			alert('Geolocation is not supported by this browser.');
		}
	}, []);

	useEffect(() => {
		if (cWeatherData != null) {
			setCity(cWeatherData.name);
		}
	}, [cWeatherData]);

	useEffect(() => {
		const groupDataByDate = () => {
			const groups = forecastData.list.reduce((groups, item) => {
				const date = item.dt_txt.split(' ')[0];
				const group = groups[date] || [];
				group.push(item);
				groups[date] = group;
				return groups;
			}, {});
			const groupArrays = Object.keys(groups).map((date) => {
				return {
					date,
					data: groups[date],
				};
			});
			setForecastDataGrouped(groupArrays);
		};
		//only when the foreCastData is not empty
		if (forecastData) {
			groupDataByDate();
		}
	}, [forecastData]);

	if (cWeatherError || forecastError) {
		return <div>Error: {cWeatherError.message || forecastError.message}</div>;
	} else if (cWeatherLoading || forecastLoading || cWeatherData == null || forecastData == null) {
		return (
			<div id="loader">
				<Loader />
			</div>
		);
	} else {
		return (
			<>
				<Navbar />
				<main className="main-div">
					<h2>Enter a city below 👇</h2>
					<input
						type="text"
						value={city}
						onChange={(e) => setCity(e.currentTarget.value)}
						onKeyDown={() => handleKeyDown()}
						onKeyUp={() => handleKeyUp()}
					/>
					<section id="mapAndWeathercard">
						<MainWeatherCard data={cWeatherData} />
						<MapContainer setCWeatherUrl={setCWeatherUrl} setForecastUrl={setForecastUrl} coord={cWeatherData.coord} />
					</section>

					<section>
						<DailyForecast
							data={forecastDataGrouped}
							setActiveWeatherCard={setActiveWeatherCard}
							activeWeatherCard={activeWeatherCard}
						/>
					</section>
					<section>
						<HourlyForecast data={forecastDataGrouped[activeWeatherCard]} />
					</section>

					<section>
						<p className="required-things-heading">Things you should carry in your bag 🎒</p>
						<Box itemType="things" weather={cWeatherData.weather[0].main} />
					</section>
					<section>
						<p className="required-things-heading">Things you eat 😋</p>
						<Box itemType="food" weather={cWeatherData.weather[0].main} />
					</section>
					<section>
						<p className="required-things-heading">Songs to listen to 🎶</p>
						<PlaylistRecommendation weather={cWeatherData.weather[0].main} />
					</section>
				</main>
			</>
		);
	}
}

export default App;
