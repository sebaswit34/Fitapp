const User = require('../models/User');
const Goal = require('../models/Goal');
const bcrypt = require('bcrypt');

// Rejestracja nowego użytkownika
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Sprawdź czy użytkownik już istnieje
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Użytkownik z tym adresem email już istnieje');
            return res.redirect('/register');
        }

        // Utwórz nowego użytkownika
        const user = new User({
            name,
            email,
            password
        });

        await user.save();

        // Zaloguj użytkownika po rejestracji
        req.session.userId = user._id;
        req.flash('success', 'Rejestracja zakończona sukcesem!');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        req.flash('error', 'Wystąpił błąd podczas rejestracji');
        res.redirect('/register');
    }
};

// Logowanie użytkownika
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Znajdź użytkownika
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Nieprawidłowy email lub hasło');
            return res.redirect('/login');
        }

        // Sprawdź hasło
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Nieprawidłowy email lub hasło');
            return res.redirect('/login');
        }

        // Zaloguj użytkownika
        req.session.userId = user._id;
        req.flash('success', 'Zalogowano pomyślnie!');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Błąd logowania:', error);
        req.flash('error', 'Wystąpił błąd podczas logowania');
        res.redirect('/login');
    }
};

// Wylogowanie użytkownika
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Błąd wylogowania:', err);
            req.flash('error', 'Wystąpił błąd podczas wylogowania');
        }
        res.redirect('/');
    });
};

// Pobierz profil użytkownika
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.flash('error', 'Nie znaleziono użytkownika');
            return res.redirect('/');
        }
        
        // Przekieruj do dashboardu
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Błąd pobierania profilu:', error);
        req.flash('error', 'Wystąpił błąd podczas pobierania profilu');
        res.redirect('/dashboard');
    }
};

// Aktualizuj profil użytkownika
exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            req.flash('error', 'Nie znaleziono użytkownika');
            return res.redirect('/profile');
        }

        // Sprawdź czy nowy email nie jest już używany
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                req.flash('error', 'Ten adres email jest już używany');
                return res.redirect('/profile');
            }
        }

        // Aktualizuj dane użytkownika
        user.name = name;
        user.email = email;

        await user.save();

        req.flash('success', 'Profil zaktualizowany pomyślnie');
        res.redirect('/profile');
    } catch (error) {
        console.error('Błąd aktualizacji profilu:', error);
        req.flash('error', 'Wystąpił błąd podczas aktualizacji profilu');
        res.redirect('/profile');
    }
};

// Zmień hasło użytkownika
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            req.flash('error', 'Nie znaleziono użytkownika');
            return res.redirect('/profile');
        }

        // Sprawdź aktualne hasło
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            req.flash('error', 'Nieprawidłowe aktualne hasło');
            return res.redirect('/profile');
        }

        // Aktualizuj hasło
        user.password = newPassword;
        await user.save();

        req.flash('success', 'Hasło zmienione pomyślnie');
        res.redirect('/profile');
    } catch (error) {
        console.error('Błąd zmiany hasła:', error);
        req.flash('error', 'Wystąpił błąd podczas zmiany hasła');
        res.redirect('/profile');
    }
};

// Dodaj nowy pomiar
exports.addMeasurement = async (req, res) => {
    try {
        const {
            weight,
            height,
            chest,
            waist,
            hips,
            biceps,
            thigh
        } = req.body;

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
        }

        // Dodaj nowy pomiar
        user.measurements.push({
            date: new Date(),
            weight,
            height,
            chest,
            waist,
            hips,
            biceps,
            thigh
        });

        await user.save();

        res.json({ success: true, message: 'Pomiar dodany pomyślnie' });
    } catch (error) {
        console.error('Błąd dodawania pomiaru:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas dodawania pomiaru' });
    }
};

// Pobierz historię pomiarów
exports.getMeasurements = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
        }

        // Sortuj pomiary od najnowszych
        const measurements = user.measurements.sort((a, b) => b.date - a.date);

        res.json({ measurements });
    } catch (error) {
        console.error('Błąd pobierania pomiarów:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas pobierania pomiarów' });
    }
}; 