const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const User = require('./models/User');
const Meal = require('./models/Meal');
const Measurement = require('./models/Measurement');
const goalController = require('./controllers/goalController');
const measurementController = require('./controllers/measurementController');
const { updateGoalsFromMeasurements } = require('./controllers/goalController');
const userController = require('./controllers/userController');
require('dotenv').config();

const app = express();

// Middleware do sprawdzania czy użytkownik jest zalogowany
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    req.flash('error', 'Musisz być zalogowany, aby uzyskać dostęp do tej strony');
    res.redirect('/login');
};

// Middleware do przekazywania danych użytkownika do widoków
const userData = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            res.locals.user = user;
        } catch (error) {
            console.error('Błąd podczas pobierania danych użytkownika:', error);
        }
    }
    next();
};

// Middleware do ustawiania aktywnej strony
const setActivePage = (req, res, next) => {
    // Ustaw activePage na podstawie ścieżki URL
    const path = req.path.split('/')[1]; // pobierz pierwszą część ścieżki
    res.locals.activePage = path || 'dashboard'; // jeśli ścieżka jest pusta, ustaw 'dashboard'
    next();
};

// Konfiguracja silnika widoków
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(expressLayouts);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Konfiguracja sesji
app.use(session({
    secret: process.env.SESSION_SECRET || 'tajny_klucz_sesji_zmien_w_produkcji',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 godziny
    }
}));

// Flash messages
app.use(flash());

// Dodaj middleware userData
app.use(userData);

// Dodaj middleware setActivePage przed routingiem
app.use(setActivePage);

// Middleware do walidacji i poprawiania wartości goal
const validateGoal = async (req, res, next) => {
    if (req.body.goal === 'gain') {
        req.body.goal = 'gain_weight';
    }
    next();
};

// Połączenie z bazą danych
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sebaswit46:Pilkareczna17@cluster0.wkiftrn.mongodb.net/fitatu')
.then(() => console.log('Połączono z bazą MongoDB'))
.catch(err => {
    console.error('Błąd połączenia z MongoDB:', err);
    process.exit(1);
});

// Główna strona
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Fitatu - Monitoruj swoją dietę',
        description: 'Śledź swoje posiłki, kalorie i makroskładniki',
        user: req.session.userId ? res.locals.user : null
    });
});

// Strona rejestracji
app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Rejestracja - Fitatu',
        description: 'Zarejestruj się w Fitatu i rozpocznij monitorowanie swojej diety'
    });
});

// Obsługa formularza rejestracji
app.post('/register', async (req, res) => {
    try {
        const { email, password, confirmPassword, name, age, gender, height, weight, activity, goal } = req.body;

        // Sprawdź czy hasła się zgadzają
        if (password !== confirmPassword) {
            req.flash('error', 'Hasła nie są identyczne');
            return res.render('register', {
                title: 'Rejestracja - Fitatu',
                description: 'Zarejestruj się w Fitatu i rozpocznij monitorowanie swojej diety',
                error: req.flash('error')
            });
        }

        // Sprawdź czy użytkownik już istnieje
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Użytkownik z tym adresem email już istnieje');
            return res.render('register', {
                title: 'Rejestracja - Fitatu',
                description: 'Zarejestruj się w Fitatu i rozpocznij monitorowanie swojej diety',
                error: req.flash('error')
            });
        }

        // Utwórz nowego użytkownika
        const user = new User({
            email,
            password,
            name,
            age,
            gender,
            height,
            weight,
            activity,
            goal
        });

        await user.save();
        req.flash('success', 'Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
        res.redirect('/login');
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        req.flash('error', 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
        res.render('register', {
            title: 'Rejestracja - Fitatu',
            description: 'Zarejestruj się w Fitatu i rozpocznij monitorowanie swojej diety',
            error: req.flash('error')
        });
    }
});

// Strona logowania
app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Logowanie - Fitatu',
        description: 'Zaloguj się do swojego konta Fitatu'
    });
});

// Obsługa formularza logowania
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Znajdź użytkownika i załaduj hasło
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            req.flash('error', 'Nieprawidłowy email lub hasło');
            return res.render('login', {
                title: 'Logowanie - Fitatu',
                description: 'Zaloguj się do swojego konta Fitatu',
                error: req.flash('error')
            });
        }

        // Sprawdź hasło
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Nieprawidłowy email lub hasło');
            return res.render('login', {
                title: 'Logowanie - Fitatu',
                description: 'Zaloguj się do swojego konta Fitatu',
                error: req.flash('error')
            });
        }

        // Aktualizuj datę ostatniego logowania
        await User.findByIdAndUpdate(user._id, { 
            $set: { lastLogin: new Date() } 
        }, { 
            new: true,
            runValidators: false 
        });

        // Ustaw sesję użytkownika
        req.session.userId = user._id;
        req.flash('success', 'Zalogowano pomyślnie!');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Błąd logowania:', error);
        req.flash('error', 'Wystąpił błąd podczas logowania. Spróbuj ponownie.');
        res.render('login', {
            title: 'Logowanie - Fitatu',
            description: 'Zaloguj się do swojego konta Fitatu',
            error: req.flash('error')
        });
    }
});

// Dashboard
app.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render('dashboard', {
            title: 'Dashboard - Fitatu',
            description: 'Twój panel kontrolny Fitatu',
            user: user
        });
    } catch (error) {
        console.error('Błąd podczas ładowania dashboardu:', error);
        req.flash('error', 'Wystąpił błąd podczas ładowania dashboardu');
        res.redirect('/');
    }
});

// Wylogowanie
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Błąd podczas wylogowywania:', err);
        }
        res.redirect('/');
    });
});

// Strona menu
app.get('/menu', isAuthenticated, async (req, res) => {
    try {
        const meals = await Meal.find({ user: req.session.userId });
        res.render('menu', {
            title: 'Jadłospis - Fitatu',
            meals: meals
        });
    } catch (error) {
        console.error('Błąd podczas pobierania posiłków:', error);
        req.flash('error', 'Wystąpił błąd podczas pobierania posiłków');
        res.redirect('/dashboard');
    }
});

// Strona pomiarów
app.get('/measurements', isAuthenticated, async (req, res) => {
    try {
        const measurements = await Measurement.find({ user: req.session.userId })
            .sort({ date: -1 });
        res.render('measurements', { 
            title: 'Moje Pomiary',
            measurements 
        });
    } catch (error) {
        console.error('Błąd podczas pobierania pomiarów:', error);
        res.status(500).render('error', { 
            message: 'Wystąpił błąd podczas pobierania pomiarów' 
        });
    }
});

// API dla posiłków
// Pobierz wszystkie posiłki użytkownika
app.get('/api/meals', isAuthenticated, async (req, res) => {
    try {
        const { date, type } = req.query;
        const query = { user: req.session.userId };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (type) {
            query.type = type;
        }

        const meals = await Meal.find(query).sort({ date: -1, type: 1 });
        res.json(meals);
    } catch (error) {
        console.error('Błąd podczas pobierania posiłków:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania posiłków' });
    }
});

// Pobierz pojedynczy posiłek
app.get('/api/meals/:id', isAuthenticated, async (req, res) => {
    try {
        const meal = await Meal.findOne({
            _id: req.params.id,
            user: req.session.userId
        });

        if (!meal) {
            return res.status(404).json({ error: 'Posiłek nie został znaleziony' });
        }

        res.json(meal);
    } catch (error) {
        console.error('Błąd podczas pobierania posiłku:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania posiłku' });
    }
});

// Dodaj nowy posiłek
app.post('/api/meals', isAuthenticated, async (req, res) => {
    try {
        // Sprawdź czy wszystkie wymagane pola są obecne
        const requiredFields = ['name', 'type', 'calories', 'protein', 'carbs', 'fat'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: `Brakujące wymagane pola: ${missingFields.join(', ')}` 
            });
        }

        const mealData = {
            ...req.body,
            user: req.session.userId,
            date: req.body.date ? new Date(req.body.date) : new Date()
        };

        // Konwertuj wartości numeryczne
        mealData.calories = Number(mealData.calories);
        mealData.protein = Number(mealData.protein);
        mealData.carbs = Number(mealData.carbs);
        mealData.fat = Number(mealData.fat);

        const meal = new Meal(mealData);
        await meal.save();
        
        console.log('Dodano nowy posiłek:', meal);
        res.status(201).json(meal);
    } catch (error) {
        console.error('Błąd podczas dodawania posiłku:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Nieprawidłowe dane posiłku: ' + Object.values(error.errors).map(e => e.message).join(', ')
            });
        }
        res.status(500).json({ error: 'Wystąpił błąd podczas dodawania posiłku' });
    }
});

// Aktualizuj posiłek
app.put('/api/meals/:id', isAuthenticated, async (req, res) => {
    try {
        const meal = await Meal.findOneAndUpdate(
            { _id: req.params.id, user: req.session.userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!meal) {
            return res.status(404).json({ error: 'Posiłek nie został znaleziony' });
        }

        res.json(meal);
    } catch (error) {
        console.error('Błąd podczas aktualizacji posiłku:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji posiłku' });
    }
});

// Usuń posiłek
app.delete('/api/meals/:id', isAuthenticated, async (req, res) => {
    try {
        const meal = await Meal.findOneAndDelete({
            _id: req.params.id,
            user: req.session.userId
        });

        if (!meal) {
            return res.status(404).json({ error: 'Posiłek nie został znaleziony' });
        }

        res.json({ message: 'Posiłek został usunięty' });
    } catch (error) {
        console.error('Błąd podczas usuwania posiłku:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas usuwania posiłku' });
    }
});

// Generuj jadłospis
app.post('/api/meals/generate', isAuthenticated, async (req, res) => {
    try {
        const { date } = req.body;
        const user = await User.findById(req.session.userId);

        // Tutaj można dodać logikę generowania jadłospisu
        // Na razie zwracamy pustą odpowiedź
        res.json({ message: 'Funkcja generowania jadłospisu będzie dostępna wkrótce' });
    } catch (error) {
        console.error('Błąd podczas generowania jadłospisu:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas generowania jadłospisu' });
    }
});

// API dla pomiarów
// Pobierz wszystkie pomiary użytkownika
app.get('/api/measurements', isAuthenticated, async (req, res) => {
    try {
        const measurements = await Measurement.find({ user: req.session.userId })
            .sort({ date: -1 });
        res.json(measurements);
    } catch (error) {
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania pomiarów' });
    }
});

// Pobierz pojedynczy pomiar
app.get('/api/measurements/:id', isAuthenticated, async (req, res) => {
    try {
        const measurement = await Measurement.findOne({
            _id: req.params.id,
            user: req.session.userId
        });
        
        if (!measurement) {
            return res.status(404).json({ error: 'Nie znaleziono pomiaru' });
        }
        
        res.json(measurement);
    } catch (error) {
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania pomiaru' });
    }
});

// Dodaj nowy pomiar
app.post('/api/measurements', isAuthenticated, measurementController.addMeasurement);

// Aktualizuj pomiar
app.put('/api/measurements/:id', isAuthenticated, measurementController.updateMeasurement);

// Usuń pomiar
app.delete('/api/measurements/:id', isAuthenticated, measurementController.deleteMeasurement);

// Ścieżki dla widoków
app.get('/goals', isAuthenticated, goalController.getGoals);

// Ścieżki API dla celów
app.post('/api/goals', isAuthenticated, goalController.addGoal);
app.get('/api/goals/:id', isAuthenticated, goalController.getGoalDetails);
app.put('/api/goals/:id', isAuthenticated, goalController.updateGoal);
app.delete('/api/goals/:id', isAuthenticated, goalController.deleteGoal);

// Aktualizuj główny cel użytkownika
app.put('/api/user/goal', isAuthenticated, validateGoal, async (req, res) => {
    try {
        const { goal } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Nie znaleziono użytkownika'
            });
        }

        // Sprawdź czy wartość goal jest poprawna
        if (!['lose_weight', 'maintain', 'gain_weight'].includes(goal)) {
            return res.status(400).json({
                success: false,
                message: 'Nieprawidłowa wartość celu'
            });
        }

        user.goal = goal;
        await user.save();

        res.json({
            success: true,
            message: 'Cel został zaktualizowany pomyślnie'
        });
    } catch (error) {
        console.error('Błąd podczas aktualizacji celu:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas aktualizacji celu'
        });
    }
});

// Aktualizuj dane użytkownika
app.post('/api/user/update-data', isAuthenticated, validateGoal, async (req, res) => {
    try {
        const { weight, height, age, goal } = req.body;
        
        // Walidacja danych
        if (!weight || !height || !age) {
            return res.status(400).json({
                success: false,
                message: 'Wszystkie pola są wymagane'
            });
        }

        if (weight < 30 || weight > 300) {
            return res.status(400).json({
                success: false,
                message: 'Waga musi być między 30 a 300 kg'
            });
        }

        if (height < 100 || height > 250) {
            return res.status(400).json({
                success: false,
                message: 'Wzrost musi być między 100 a 250 cm'
            });
        }

        if (age < 16 || age > 100) {
            return res.status(400).json({
                success: false,
                message: 'Wiek musi być między 16 a 100 lat'
            });
        }

        // Aktualizuj dane użytkownika
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Nie znaleziono użytkownika'
            });
        }

        // Zachowaj aktualną wartość goal, jeśli nie została podana w żądaniu
        if (!goal) {
            req.body.goal = user.goal;
        }

        // Aktualizuj dane użytkownika
        Object.assign(user, {
            weight,
            height,
            age,
            goal: req.body.goal
        });

        // Dodaj nowy pomiar
        user.measurements.push({
            date: new Date(),
            weight,
            height,
            chest: user.measurements.length > 0 ? user.measurements[user.measurements.length - 1].chest : 0,
            waist: user.measurements.length > 0 ? user.measurements[user.measurements.length - 1].waist : 0,
            hips: user.measurements.length > 0 ? user.measurements[user.measurements.length - 1].hips : 0,
            biceps: user.measurements.length > 0 ? user.measurements[user.measurements.length - 1].biceps : 0,
            thigh: user.measurements.length > 0 ? user.measurements[user.measurements.length - 1].thigh : 0,
            calf: user.measurements.length > 0 ? user.measurements[user.measurements.length - 1].calf : 0
        });

        await user.save();

        // Aktualizuj cele na podstawie nowego pomiaru
        await updateGoalsFromMeasurements(req.session.userId);

        res.json({
            success: true,
            message: 'Dane zostały zaktualizowane pomyślnie'
        });
    } catch (error) {
        console.error('Błąd podczas aktualizacji danych:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas aktualizacji danych'
        });
    }
});

// Endpoint do sprawdzenia i naprawy nieprawidłowych wartości goal
app.get('/api/fix-goals', isAuthenticated, async (req, res) => {
    try {
        // Znajdź wszystkich użytkowników z nieprawidłową wartością goal
        const users = await User.find({ goal: 'gain' });
        
        if (users.length === 0) {
            return res.json({
                success: true,
                message: 'Nie znaleziono użytkowników z nieprawidłową wartością goal'
            });
        }

        // Aktualizuj wartości na 'gain_weight'
        const updateResult = await User.updateMany(
            { goal: 'gain' },
            { $set: { goal: 'gain_weight' } }
        );

        res.json({
            success: true,
            message: `Zaktualizowano ${updateResult.modifiedCount} użytkowników`,
            details: {
                found: users.length,
                updated: updateResult.modifiedCount
            }
        });
    } catch (error) {
        console.error('Błąd podczas naprawy wartości goal:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas naprawy wartości goal'
        });
    }
});

// Aktualizuj kaloryczność i makroskładniki
app.post('/api/user/update-calories', isAuthenticated, async (req, res) => {
    try {
        const { calories, proteinPercentage, carbsPercentage, fatPercentage } = req.body;

        // Walidacja danych
        if (!calories || !proteinPercentage || !carbsPercentage || !fatPercentage) {
            return res.status(400).json({
                success: false,
                message: 'Wszystkie pola są wymagane'
            });
        }

        if (calories < 1000 || calories > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Kaloryczność musi być między 1000 a 5000 kcal'
            });
        }

        if (proteinPercentage < 10 || proteinPercentage > 50) {
            return res.status(400).json({
                success: false,
                message: 'Procent białka musi być między 10% a 50%'
            });
        }

        if (carbsPercentage < 20 || carbsPercentage > 60) {
            return res.status(400).json({
                success: false,
                message: 'Procent węglowodanów musi być między 20% a 60%'
            });
        }

        if (fatPercentage < 20 || fatPercentage > 40) {
            return res.status(400).json({
                success: false,
                message: 'Procent tłuszczu musi być między 20% a 40%'
            });
        }

        // Sprawdź czy suma procentów wynosi 100%
        const totalPercentage = proteinPercentage + carbsPercentage + fatPercentage;
        if (totalPercentage !== 100) {
            return res.status(400).json({
                success: false,
                message: 'Suma procentów makroskładników musi wynosić 100%'
            });
        }

        // Oblicz gramy makroskładników
        const proteinGrams = Math.round((calories * proteinPercentage / 100) / 4);
        const carbsGrams = Math.round((calories * carbsPercentage / 100) / 4);
        const fatGrams = Math.round((calories * fatPercentage / 100) / 9);

        // Aktualizuj dane użytkownika
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Nie znaleziono użytkownika'
            });
        }

        // Aktualizuj cele dzienne
        user.dailyGoals = {
            calories,
            protein: proteinGrams,
            carbs: carbsGrams,
            fat: fatGrams,
            proteinPercentage,
            carbsPercentage,
            fatPercentage
        };

        await user.save();

        res.json({
            success: true,
            message: 'Kaloryczność i makroskładniki zostały zaktualizowane',
            goals: user.dailyGoals
        });
    } catch (error) {
        console.error('Błąd podczas aktualizacji kaloryczności:', error);
        res.status(500).json({
            success: false,
            message: 'Wystąpił błąd podczas aktualizacji kaloryczności'
        });
    }
});

// Profile routes
app.get('/profile', isAuthenticated, (req, res) => { res.redirect('/dashboard'); });
app.post('/profile/password', isAuthenticated, userController.changePassword);
app.post('/api/profile/measurements', isAuthenticated, userController.addMeasurement);
app.get('/api/profile/measurements', isAuthenticated, userController.getMeasurements);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serwer uruchomiony na porcie ${PORT}`);
});
