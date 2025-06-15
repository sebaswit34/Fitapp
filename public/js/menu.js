document.addEventListener('DOMContentLoaded', () => {
    const addMealBtn = document.getElementById('addMealBtn');
    const generateMenuBtn = document.getElementById('generateMenuBtn');
    const mealModal = document.getElementById('mealModal');
    const mealForm = document.getElementById('mealForm');
    const modalClose = document.querySelector('.modal__close');
    const dateFilter = document.getElementById('dateFilter');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const todayBtn = document.getElementById('todayBtn');
    const openCalendarBtn = document.getElementById('openCalendarBtn');
    const weekViewDays = document.querySelector('.week-view__days');
    const weekViewDates = document.querySelector('.week-view__dates');

    // Skróty nazw dni tygodnia
    const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

    // Inicjalizacja widoku tygodnia tylko jeśli elementy istnieją
    if (weekViewDays && weekViewDates && dateFilter) {
        initializeWeekView();
    }

    // Funkcja inicjalizująca widok tygodnia
    function initializeWeekView() {
        console.log('Inicjalizacja widoku tygodnia');
        const today = new Date();
        let currentDate = new Date(dateFilter.value || today);

        // Funkcja aktualizująca widok tygodnia
        function updateWeekView(date) {
            console.log('Aktualizacja widoku tygodnia dla daty:', date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)); // Ustaw na poniedziałek

            // Generuj dni tygodnia
            weekViewDays.innerHTML = '';
            weekViewDates.innerHTML = '';

            for (let i = 0; i < 7; i++) {
                const currentDay = new Date(weekStart);
                currentDay.setDate(weekStart.getDate() + i);

                // Dodaj nazwę dnia
                const dayElement = document.createElement('div');
                dayElement.className = 'week-view__day';
                dayElement.textContent = dayNames[i];
                weekViewDays.appendChild(dayElement);

                // Dodaj datę
                const dateElement = document.createElement('div');
                dateElement.className = 'week-view__date';
                dateElement.textContent = currentDay.getDate();
                
                // Dodaj klasę dla aktualnego dnia
                if (currentDay.toDateString() === today.toDateString()) {
                    dateElement.classList.add('today');
                }
                
                // Dodaj klasę dla wybranego dnia
                if (currentDay.toDateString() === date.toDateString()) {
                    dateElement.classList.add('selected');
                }

                // Dodaj obsługę kliknięcia
                dateElement.addEventListener('click', () => {
                    // Usuń klasę selected ze wszystkich dat
                    document.querySelectorAll('.week-view__date').forEach(el => el.classList.remove('selected'));
                    // Dodaj klasę selected do klikniętej daty
                    dateElement.classList.add('selected');
                    // Aktualizuj filtr daty
                    dateFilter.value = currentDay.toISOString().split('T')[0];
                    // Wywołaj zdarzenie change na filtrze daty
                    dateFilter.dispatchEvent(new Event('change'));
                });

                weekViewDates.appendChild(dateElement);
            }
        }

        // Obsługa przycisków nawigacji
        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                currentDate.setDate(currentDate.getDate() - 7);
                dateFilter.value = currentDate.toISOString().split('T')[0];
                updateWeekView(currentDate);
                dateFilter.dispatchEvent(new Event('change'));
            });
        }

        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                currentDate.setDate(currentDate.getDate() + 7);
                dateFilter.value = currentDate.toISOString().split('T')[0];
                updateWeekView(currentDate);
                dateFilter.dispatchEvent(new Event('change'));
            });
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                currentDate = new Date();
                dateFilter.value = currentDate.toISOString().split('T')[0];
                updateWeekView(currentDate);
                dateFilter.dispatchEvent(new Event('change'));
            });
        }

        if (openCalendarBtn) {
            openCalendarBtn.addEventListener('click', () => {
                dateFilter.click();
            });
        }

        // Obsługa zmiany daty w kalendarzu
        dateFilter.addEventListener('change', () => {
            currentDate = new Date(dateFilter.value);
            updateWeekView(currentDate);
        });

        // Inicjalizuj widok dla aktualnej daty
        updateWeekView(currentDate);
    }

    // Wybór daty
    window.selectDate = function(dateStr) {
        dateFilter.value = dateStr;
        dateFilter.dispatchEvent(new Event('change'));
        updateWeekView();
    };

    // Funkcja do aktualizacji tygodnia
    function updateWeek(days) {
        const currentDate = new Date(dateFilter.value);
        currentDate.setDate(currentDate.getDate() + days);
        dateFilter.valueAsDate = currentDate;
        dateFilter.dispatchEvent(new Event('change'));
        updateWeekView();
    }

    // Obsługa przycisków nawigacji
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => updateWeek(-7));
    }
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => updateWeek(7));
    }
    if (todayBtn && dateFilter) {
        todayBtn.addEventListener('click', () => {
            dateFilter.valueAsDate = new Date();
            dateFilter.dispatchEvent(new Event('change'));
        });
    }

    // Obsługa przycisku kalendarza
    if (openCalendarBtn && dateFilter) {
        openCalendarBtn.addEventListener('click', () => {
            dateFilter.showPicker();
        });
    }

    // Obsługa zmiany daty w kalendarzu
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            if (weekViewDates) {
                updateWeekView();
            }
            if (typeof updateDailySummary === 'function') {
                updateDailySummary();
            }
        });
    }

    // Dodaj obsługę klawiszy strzałek tylko jeśli dateFilter istnieje
    if (dateFilter) {
        document.addEventListener('keydown', (e) => {
            if (e.target === dateFilter || e.target === document.body) {
                if (e.key === 'ArrowLeft') {
                    updateWeek(-7);
                } else if (e.key === 'ArrowRight') {
                    updateWeek(7);
                } else if (e.key === 't' || e.key === 'T') {
                    dateFilter.valueAsDate = new Date();
                    dateFilter.dispatchEvent(new Event('change'));
                    if (weekViewDates) {
                        updateWeekView();
                    }
                }
            }
        });
    }

    // Dodaj tooltipy dla skrótów klawiszowych
    if (prevWeekBtn) prevWeekBtn.title = 'Poprzedni tydzień';
    if (nextWeekBtn) nextWeekBtn.title = 'Następny tydzień';
    if (todayBtn) todayBtn.title = 'Dzisiaj';

    // Inicjalizacja daty tylko jeśli dateFilter istnieje
    if (dateFilter) {
        dateFilter.valueAsDate = new Date();
    }

    // Obsługa modalu i formularza posiłku
    if (addMealBtn && mealModal && mealForm) {
        addMealBtn.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Dodaj Posiłek';
            mealForm.reset();
            document.getElementById('mealId').value = '';
            mealModal.classList.add('active');
        });

        // Zamykanie modalu
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }
        mealModal.addEventListener('click', (e) => {
            if (e.target === mealModal) {
                closeModal();
            }
        });

        // Obsługa formularza
        mealForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(mealForm);
            const mealData = Object.fromEntries(formData.entries());
            const mealId = document.getElementById('mealId').value;

            // Dodaj datę z filtra
            const dateFilter = document.getElementById('dateFilter');
            if (dateFilter && dateFilter.value) {
                mealData.date = dateFilter.value;
            } else {
                mealData.date = new Date().toISOString().split('T')[0];
            }

            try {
                const response = await fetch(`/api/meals${mealId ? `/${mealId}` : ''}`, {
                    method: mealId ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mealData),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Wystąpił błąd podczas zapisywania posiłku');
                }

                closeModal();
                window.location.reload();
            } catch (error) {
                console.error('Błąd:', error);
                alert(error.message);
            }
        });
    }

    // Filtrowanie posiłków po dacie
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            const date = dateFilter.value;
            const mealCards = document.querySelectorAll('.meal-card');

            mealCards.forEach(card => {
                const mealDate = card.dataset.date;
                card.style.display = !date || mealDate === date ? 'block' : 'none';
            });

            // Aktualizuj widoczność sekcji
            document.querySelectorAll('.meal-section').forEach(section => {
                const visibleMeals = section.querySelectorAll('.meal-card[style="display: block"]').length;
                const emptyMessage = section.querySelector('.meal-section__empty');
                
                if (emptyMessage) {
                    emptyMessage.style.display = visibleMeals === 0 ? 'block' : 'none';
                }
            });

            if (typeof updateDailySummary === 'function') {
                updateDailySummary();
            }
        });
    }

    // Generowanie jadłospisu
    if (generateMenuBtn && dateFilter) {
        generateMenuBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/meals/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        date: dateFilter.value,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Wystąpił błąd podczas generowania jadłospisu');
                }

                window.location.reload();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Aktualizuj podsumowanie tylko jeśli funkcja istnieje
    if (typeof updateDailySummary === 'function') {
        updateDailySummary();
    }
});

// Funkcje pomocnicze
function closeModal() {
    const mealModal = document.getElementById('mealModal');
    mealModal.classList.remove('active');
}

async function editMeal(mealId) {
    try {
        const response = await fetch(`/api/meals/${mealId}`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Nie udało się pobrać danych posiłku');
        }

        const meal = await response.json();
        document.getElementById('modalTitle').textContent = 'Edytuj Posiłek';
        document.getElementById('mealId').value = meal._id;
        document.getElementById('mealName').value = meal.name;
        document.getElementById('mealType').value = meal.type;
        document.getElementById('mealCalories').value = meal.calories;
        document.getElementById('mealProtein').value = meal.protein;
        document.getElementById('mealCarbs').value = meal.carbs;
        document.getElementById('mealFat').value = meal.fat;
        document.getElementById('mealDescription').value = meal.description || '';

        // Ustaw datę w filtrze na datę posiłku
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.value = new Date(meal.date).toISOString().split('T')[0];
        }

        document.getElementById('mealModal').classList.add('active');
    } catch (error) {
        console.error('Błąd:', error);
        alert(error.message);
    }
}

async function deleteMeal(mealId) {
    if (!confirm('Czy na pewno chcesz usunąć ten posiłek?')) {
        return;
    }

    try {
        const response = await fetch(`/api/meals/${mealId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Wystąpił błąd podczas usuwania posiłku');
        }

        window.location.reload();
        if (typeof updateDailySummary === 'function') {
            updateDailySummary();
        }
    } catch (error) {
        alert(error.message);
    }
}

function updateDailySummary() {
    const dateFilter = document.getElementById('dateFilter');
    if (!dateFilter) return;

    const date = dateFilter.value;
    const meals = document.querySelectorAll('.meal-card');
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    // Pobierz cele z elementów DOM
    const targets = {
        calories: parseInt(document.getElementById('caloriesTarget').textContent),
        protein: parseInt(document.getElementById('proteinTarget').textContent),
        carbs: parseInt(document.getElementById('carbsTarget').textContent),
        fat: parseInt(document.getElementById('fatTarget').textContent)
    };

    // Aktualizuj datę w podsumowaniu
    const summaryDate = document.getElementById('summaryDate');
    if (summaryDate) {
        const dateObj = new Date(date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        summaryDate.textContent = dateObj.toLocaleDateString('pl-PL', options);
    }

    // Sumuj wartości z posiłków dla wybranej daty
    meals.forEach(meal => {
        if (meal.dataset.date === date) {
            const calories = parseInt(meal.querySelector('.meal-info__item:nth-child(1) span').textContent);
            const protein = parseFloat(meal.querySelector('.meal-info__item:nth-child(2) span').textContent);
            const carbs = parseFloat(meal.querySelector('.meal-info__item:nth-child(3) span').textContent);
            const fat = parseFloat(meal.querySelector('.meal-info__item:nth-child(4) span').textContent);

            totalCalories += calories;
            totalProtein += protein;
            totalCarbs += carbs;
            totalFat += fat;
        }
    });

    // Aktualizuj wartości w podsumowaniu
    const totalCaloriesElement = document.getElementById('totalCalories');
    const totalProteinElement = document.getElementById('totalProtein');
    const totalCarbsElement = document.getElementById('totalCarbs');
    const totalFatElement = document.getElementById('totalFat');

    if (totalCaloriesElement) {
        totalCaloriesElement.textContent = totalCalories;
        document.getElementById('caloriesProgress').style.width = `${Math.min(100, (totalCalories / targets.calories) * 100)}%`;
    }

    if (totalProteinElement) {
        totalProteinElement.textContent = totalProtein;
        document.getElementById('proteinProgress').style.width = `${Math.min(100, (totalProtein / targets.protein) * 100)}%`;
    }

    if (totalCarbsElement) {
        totalCarbsElement.textContent = totalCarbs;
        document.getElementById('carbsProgress').style.width = `${Math.min(100, (totalCarbs / targets.carbs) * 100)}%`;
    }

    if (totalFatElement) {
        totalFatElement.textContent = totalFat;
        document.getElementById('fatProgress').style.width = `${Math.min(100, (totalFat / targets.fat) * 100)}%`;
    }
}

// Dodaj style CSS dla ostrzeżenia
const style = document.createElement('style');
style.textContent = `
    .warning {
        color: #ff4444 !important;
        font-weight: bold !important;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style); 