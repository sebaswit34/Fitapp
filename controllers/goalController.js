const Goal = require('../models/Goal');
const User = require('../models/User');
const Measurement = require('../models/Measurement');

// Funkcja pomocnicza do aktualizacji celów na podstawie pomiarów
exports.updateGoalsFromMeasurements = async function(userId) {
    try {
        // Pobierz wszystkie aktywne cele użytkownika
        const goals = await Goal.find({ 
            userId: userId,
            status: 'active'
        });

        // Pobierz najnowszy pomiar użytkownika
        const latestMeasurement = await Measurement.findOne({ user: userId })
            .sort({ date: -1 });

        if (!latestMeasurement) {
            console.log('Brak pomiarów dla użytkownika');
            return;
        }

        // Aktualizuj każdy cel
        for (const goal of goals) {
            let currentValue;
            switch (goal.measurementType) {
                case 'weight':
                    currentValue = latestMeasurement.weight;
                    break;
                case 'chest':
                    currentValue = latestMeasurement.chest;
                    break;
                case 'biceps':
                    currentValue = latestMeasurement.biceps;
                    break;
                case 'waist':
                    currentValue = latestMeasurement.waist;
                    break;
                case 'hips':
                    currentValue = latestMeasurement.hips;
                    break;
                case 'thigh':
                    currentValue = latestMeasurement.thigh;
                    break;
                case 'calf':
                    currentValue = latestMeasurement.calf;
                    break;
                default:
                    continue;
            }

            // Oblicz postęp
            const totalChange = goal.targetValue - goal.initialValue;
            const currentChange = currentValue - goal.initialValue;
            
            // Określ kierunek zmiany (przyrost lub spadek)
            const isIncrease = totalChange > 0;
            
            // Oblicz procent postępu
            let progress;
            if (isIncrease) {
                // Dla celów typu "zwiększenie" (np. przyrost masy)
                progress = Math.round((currentChange / totalChange) * 100);
            } else {
                // Dla celów typu "zmniejszenie" (np. utrata wagi)
                progress = Math.round((1 - (currentChange / totalChange)) * 100);
            }

            // Ogranicz postęp do zakresu 0-100%
            progress = Math.min(Math.max(progress, 0), 100);

            // Aktualizuj cel
            goal.currentValue = currentValue;
            goal.progress = progress;

            // Aktualizuj status
            if (progress >= 100) {
                goal.status = 'completed';
            } else if (new Date() > goal.endDate && progress < 100) {
                goal.status = 'failed';
            }

            await goal.save();
        }
    } catch (error) {
        console.error('Błąd podczas aktualizacji celów z pomiarów:', error);
    }
};

// Pobierz wszystkie cele użytkownika
exports.getGoals = async (req, res) => {
    try {
        // Najpierw zaktualizuj cele na podstawie najnowszych pomiarów
        await exports.updateGoalsFromMeasurements(req.session.userId);

        // Pobierz zaktualizowane cele
        const goals = await Goal.find({ userId: req.session.userId })
            .sort({ startDate: -1 });

        // Pobierz pomiary użytkownika
        const measurements = await Measurement.find({ user: req.session.userId })
            .sort({ date: -1 });

        res.render('goals', {
            title: 'Moje Cele',
            goals,
            measurements,
            user: res.locals.user,
            script: 'goals'
        });
    } catch (error) {
        console.error('Błąd podczas pobierania celów:', error);
        req.flash('error', 'Wystąpił błąd podczas pobierania celów');
        res.redirect('/dashboard');
    }
};

// Dodaj nowy cel
exports.addGoal = async (req, res) => {
    try {
        const { measurementType, initialValue, targetValue, startDate, endDate } = req.body;

        // Pobierz najnowszy pomiar użytkownika
        const latestMeasurement = await Measurement.findOne({ user: req.session.userId })
            .sort({ date: -1 });

        if (!latestMeasurement) {
            return res.status(400).json({
                success: false,
                message: 'Brak pomiarów. Najpierw dodaj pomiar.'
            });
        }

        let currentValue;
        switch (measurementType) {
            case 'weight':
                currentValue = latestMeasurement.weight;
                break;
            case 'chest':
                currentValue = latestMeasurement.chest;
                break;
            case 'biceps':
                currentValue = latestMeasurement.biceps;
                break;
            case 'waist':
                currentValue = latestMeasurement.waist;
                break;
            case 'hips':
                currentValue = latestMeasurement.hips;
                break;
            case 'thigh':
                currentValue = latestMeasurement.thigh;
                break;
            case 'calf':
                currentValue = latestMeasurement.calf;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Nieprawidłowy typ pomiaru'
                });
        }

        // Oblicz początkowy postęp
        const totalChange = parseFloat(targetValue) - parseFloat(initialValue);
        const currentChange = currentValue - parseFloat(initialValue);
        
        // Określ kierunek zmiany
        const isIncrease = totalChange > 0;
        
        // Oblicz procent postępu
        let progress;
        if (isIncrease) {
            progress = Math.round((currentChange / totalChange) * 100);
        } else {
            progress = Math.round((1 - (currentChange / totalChange)) * 100);
        }
        
        // Ogranicz postęp do zakresu 0-100%
        progress = Math.min(Math.max(progress, 0), 100);

        const goal = new Goal({
            userId: req.session.userId,
            measurementType,
            initialValue: parseFloat(initialValue),
            currentValue: currentValue,
            targetValue: parseFloat(targetValue),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            progress: progress,
            status: 'active'
        });

        await goal.save();

        // Aktualizuj cele użytkownika
        await User.findByIdAndUpdate(req.session.userId, {
            $push: { goals: goal._id }
        });

        res.status(201).json({
            success: true,
            message: 'Cel został dodany pomyślnie',
            goal: {
                ...goal.toObject(),
                difference: currentValue - parseFloat(initialValue),
                totalChange: parseFloat(targetValue) - parseFloat(initialValue)
            }
        });
    } catch (error) {
        console.error('Błąd podczas dodawania celu:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Wystąpił błąd podczas dodawania celu'
        });
    }
};

// Pobierz szczegóły celu
exports.getGoalDetails = async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!goal) {
            return res.status(404).json({ 
                success: false, 
                message: 'Nie znaleziono celu' 
            });
        }

        res.json({
            success: true,
            goal: {
                ...goal.toObject(),
                difference: goal.currentValue - goal.initialValue,
                totalChange: goal.targetValue - goal.initialValue
            }
        });
    } catch (error) {
        console.error('Błąd podczas pobierania szczegółów celu:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Wystąpił błąd podczas pobierania szczegółów celu' 
        });
    }
};

// Aktualizuj cel
exports.updateGoal = async (req, res) => {
    try {
        const { measurementType, targetValue, startDate, endDate } = req.body;
        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Nie znaleziono celu'
            });
        }

        // Zachowaj początkową wartość
        const initialValue = goal.initialValue;

        // Pobierz najnowszy pomiar
        const latestMeasurement = await Measurement.findOne({ user: req.session.userId })
            .sort({ date: -1 });

        if (!latestMeasurement) {
            return res.status(400).json({
                success: false,
                message: 'Brak pomiarów. Najpierw dodaj pomiar.'
            });
        }

        let currentValue;
        switch (measurementType) {
            case 'weight':
                currentValue = latestMeasurement.weight;
                break;
            case 'chest':
                currentValue = latestMeasurement.chest;
                break;
            case 'biceps':
                currentValue = latestMeasurement.biceps;
                break;
            case 'waist':
                currentValue = latestMeasurement.waist;
                break;
            case 'hips':
                currentValue = latestMeasurement.hips;
                break;
            case 'thigh':
                currentValue = latestMeasurement.thigh;
                break;
            case 'calf':
                currentValue = latestMeasurement.calf;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Nieprawidłowy typ pomiaru'
                });
        }

        // Oblicz postęp
        const totalChange = parseFloat(targetValue) - initialValue;
        const currentChange = currentValue - initialValue;
        
        // Określ kierunek zmiany
        const isIncrease = totalChange > 0;
        
        // Oblicz procent postępu
        let progress;
        if (isIncrease) {
            progress = Math.round((currentChange / totalChange) * 100);
        } else {
            progress = Math.round((1 - (currentChange / totalChange)) * 100);
        }
        
        // Ogranicz postęp do zakresu 0-100%
        progress = Math.min(Math.max(progress, 0), 100);

        // Aktualizuj cel
        goal.measurementType = measurementType;
        goal.currentValue = currentValue;
        goal.targetValue = parseFloat(targetValue);
        goal.startDate = new Date(startDate);
        goal.endDate = new Date(endDate);
        goal.progress = progress;

        // Aktualizuj status
        if (progress >= 100) {
            goal.status = 'completed';
        } else if (new Date() > goal.endDate && progress < 100) {
            goal.status = 'failed';
        }

        await goal.save();

        res.json({
            success: true,
            message: 'Cel został zaktualizowany',
            goal: {
                ...goal.toObject(),
                difference: currentValue - initialValue,
                totalChange: parseFloat(targetValue) - initialValue
            }
        });
    } catch (error) {
        console.error('Błąd podczas aktualizacji celu:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Wystąpił błąd podczas aktualizacji celu'
        });
    }
};

// Aktualizuj postęp celu
exports.updateProgress = async (req, res) => {
    try {
        const { progress } = req.body;
        const goal = await Goal.findOne({ _id: req.params.id, userId: req.session.userId });

        if (!goal) {
            return res.status(404).json({ message: 'Nie znaleziono celu' });
        }

        goal.progress = progress;

        // Aktualizuj status celu na podstawie postępu
        if (progress >= 100) {
            goal.status = 'completed';
        } else if (new Date() > new Date(goal.endDate) && progress < 100) {
            goal.status = 'failed';
        } else {
            goal.status = 'active';
        }

        await goal.save();
        res.json({ message: 'Postęp został zaktualizowany pomyślnie', goal });
    } catch (error) {
        console.error('Błąd podczas aktualizacji postępu:', error);
        res.status(500).json({ message: 'Wystąpił błąd podczas aktualizacji postępu' });
    }
};

// Usuń cel
exports.deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.userId
        });

        if (!goal) {
            return res.status(404).json({ 
                success: false,
                message: 'Nie znaleziono celu' 
            });
        }

        // Usuń cel z listy celów użytkownika
        await User.findByIdAndUpdate(req.session.userId, {
            $pull: { goals: goal._id }
        });

        res.json({ 
            success: true,
            message: 'Cel został usunięty pomyślnie' 
        });
    } catch (error) {
        console.error('Błąd podczas usuwania celu:', error);
        res.status(500).json({ 
            success: false,
            message: 'Wystąpił błąd podczas usuwania celu' 
        });
    }
}; 