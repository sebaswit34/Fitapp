// Natychmiastowe wykonanie funkcji, aby uniknąć konfliktów z globalnym zakresem
(function() {
    console.log('Ładowanie skryptu goals.js...');

    // Funkcja inicjalizująca
    function initializeGoals() {
        console.log('Inicjalizacja funkcji goals.js...');
        
        // Inicjalizacja elementów DOM
        const goalForm = document.getElementById('goalForm');
        const goalFormError = document.getElementById('goalFormError');
        const addGoalBtn = document.getElementById('addGoalBtn');
        const goalModal = document.getElementById('goalModal');
        const goalModalTitle = document.getElementById('goalModalTitle');
        const goalModalSubmit = document.getElementById('goalModalSubmit');
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        const exercisesList = document.getElementById('exercisesList');
        const filterGoalStatus = document.getElementById('filterGoalStatus');
        const goalsList = document.getElementById('goalsList');
        const measurementForm = document.getElementById('measurementForm');
        const measurementFormError = document.getElementById('measurementFormError');
        const addMeasurementBtn = document.getElementById('addMeasurementBtn');
        const measurementModal = document.getElementById('measurementModal');
        const measurementModalTitle = document.getElementById('measurementModalLabel');
        const saveMeasurementBtn = document.getElementById('saveMeasurement');
        const dateRange = document.getElementById('dateRange');
        const measurementsTableBody = document.getElementById('measurementsTableBody');

        console.log('Elementy DOM:', {
            goalForm,
            goalFormError,
            addGoalBtn,
            goalModal,
            goalModalTitle,
            goalModalSubmit,
            addExerciseBtn,
            exercisesList,
            filterGoalStatus,
            goalsList,
            measurementForm,
            measurementFormError,
            addMeasurementBtn,
            measurementModal,
            measurementModalTitle,
            saveMeasurementBtn,
            dateRange,
            measurementsTableBody
        });

        // Inicjalizacja wykresów
        let weightChart = null;
        let measurementsChart = null;
        let goalsChart = null;

        // Funkcja do walidacji formularza
        function validateGoalForm() {
            console.log('Walidacja formularza...');
            const form = document.getElementById('goalForm');
            if (!form) {
                console.error('Nie znaleziono formularza celu!');
                return false;
            }

            const measurementType = form.measurementType.value;
            const currentValue = parseFloat(form.currentValue.value);
            const targetValue = parseFloat(form.targetValue.value);
            const startDate = new Date(form.startDate.value);
            const endDate = new Date(form.endDate.value);

            console.log('Dane formularza:', {
                measurementType,
                currentValue,
                targetValue,
                startDate,
                endDate
            });

            if (!measurementType) {
                showFormError('Wybierz typ pomiaru');
                return false;
            }

            if (isNaN(currentValue) || currentValue <= 0) {
                showFormError('Podaj prawidłową aktualną wartość');
                return false;
            }

            if (isNaN(targetValue) || targetValue <= 0) {
                showFormError('Podaj prawidłową wartość docelową');
                return false;
            }

            if (startDate >= endDate) {
                showFormError('Data rozpoczęcia musi być wcześniejsza niż data zakończenia');
                return false;
            }

            console.log('Walidacja przeszła pomyślnie');
            return true;
        }

        // Funkcja do wyświetlania błędów formularza
        function showFormError(message) {
            console.log('Wyświetlanie błędu:', message);
            const errorElement = document.getElementById('goalFormError');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.remove('d-none');
            } else {
                console.error('Nie znaleziono elementu do wyświetlania błędów!');
            }
        }

        // Funkcja do zapisywania celu
        async function saveGoal(goalId = null) {
            console.log('Zapisywanie celu...', goalId ? 'edycja' : 'nowy cel');
            try {
                const formData = {
                    measurementType: goalForm.measurementType.value,
                    initialValue: parseFloat(goalForm.initialValue.value),
                    targetValue: parseFloat(goalForm.targetValue.value),
                    startDate: goalForm.startDate.value,
                    endDate: goalForm.endDate.value
                };

                console.log('Dane formularza:', formData);

                const url = goalId ? `/api/goals/${goalId}` : '/api/goals';
                const method = goalId ? 'PUT' : 'POST';

                console.log('Wysyłam żądanie:', { url, method, goalId });

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-HTTP-Method-Override': 'PUT'  // Dodajemy nagłówek dla metody PUT
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Wystąpił błąd podczas zapisywania celu');
                }

                const result = await response.json();
                console.log('Odpowiedź serwera:', result);

                if (result.success) {
                    // Zamknij modal i odśwież stronę
                    const modal = bootstrap.Modal.getInstance(goalModal);
                    if (modal) {
                        modal.hide();
                    }
                    window.location.reload();
                } else {
                    throw new Error(result.message || 'Wystąpił błąd podczas zapisywania celu');
                }
            } catch (error) {
                console.error('Błąd podczas zapisywania celu:', error);
                if (goalFormError) {
                    goalFormError.textContent = error.message;
                    goalFormError.classList.remove('d-none');
                }
            }
        }

        // Funkcja do edycji celu
        async function editGoal(goalId) {
            console.log('Rozpoczynam edycję celu:', goalId);
            try {
                const response = await fetch(`/api/goals/${goalId}`);
                if (!response.ok) {
                    throw new Error('Nie udało się pobrać danych celu');
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || 'Nie udało się pobrać danych celu');
                }
                
                const goal = result.goal;
                console.log('Pobrano dane celu:', goal);
                
                // Aktualizuj tytuł modalu
                const modalTitle = document.getElementById('goalModalTitle');
                if (modalTitle) {
                    modalTitle.textContent = 'Edytuj cel';
                }
                
                // Wypełnij formularz danymi celu
                if (goalForm) {
                    // Zapisz ID celu w formularzu
                    goalForm.dataset.goalId = goalId;
                    
                    goalForm.measurementType.value = goal.measurementType;
                    goalForm.initialValue.value = goal.initialValue;
                    goalForm.targetValue.value = goal.targetValue;
                    
                    // Bezpieczne formatowanie dat
                    const formatDate = (dateString) => {
                        if (!dateString) return '';
                        const date = new Date(dateString);
                        return date instanceof Date && !isNaN(date) 
                            ? date.toISOString().split('T')[0] 
                            : '';
                    };
                    
                    goalForm.startDate.value = formatDate(goal.startDate);
                    goalForm.endDate.value = formatDate(goal.endDate);
                    
                    // Aktualizuj jednostki miary
                    const unit = goal.measurementType === 'weight' ? 'kg' : 'cm';
                    document.querySelectorAll('.measurement-unit').forEach(el => el.textContent = unit);
                    
                    // Zmień obsługę przycisku zapisywania na aktualizację
                    if (goalModalSubmit) {
                        goalModalSubmit.onclick = async (e) => {
                            e.preventDefault();
                            const currentGoalId = goalForm.dataset.goalId;
                            console.log('Zapisywanie zaktualizowanego celu:', currentGoalId);
                            await saveGoal(currentGoalId);
                        };
                    }
                }
                
                // Pokaż modal
                const modal = new bootstrap.Modal(goalModal);
                modal.show();
            } catch (error) {
                console.error('Błąd podczas edycji celu:', error);
                alert('Wystąpił błąd podczas edycji celu: ' + error.message);
            }
        }

        // Funkcja do usuwania celu
        async function deleteGoal(goalId) {
            console.log('Rozpoczynam usuwanie celu:', goalId);
            if (!confirm('Czy na pewno chcesz usunąć ten cel?')) {
                console.log('Usuwanie celu anulowane przez użytkownika');
                return;
            }

            try {
                const response = await fetch(`/api/goals/${goalId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Nie udało się usunąć celu');
                }
                
                const result = await response.json();
                console.log('Odpowiedź serwera po usunięciu celu:', result);
                
                if (result.success) {
                    console.log('Cel został pomyślnie usunięty');
                    // Odśwież stronę, aby zobaczyć zmiany
                    window.location.reload();
                } else {
                    throw new Error(result.message || 'Wystąpił błąd podczas usuwania celu');
                }
            } catch (error) {
                console.error('Błąd podczas usuwania celu:', error);
                alert(error.message || 'Wystąpił błąd podczas usuwania celu. Spróbuj ponownie.');
            }
        }

        // Funkcja do filtrowania celów
        function filterGoals() {
            const status = filterGoalStatus.value;
            const goals = document.querySelectorAll('.goal-card');
            
            goals.forEach(goal => {
                if (status === 'all' || goal.dataset.status === status) {
                    goal.style.display = 'block';
                } else {
                    goal.style.display = 'none';
                }
            });
        }

        // Funkcja do aktualizacji wykresu celów
        function updateGoalsChart(goals) {
            if (goalsChart) {
                goalsChart.destroy();
            }

            const ctx = document.getElementById('goalsChart').getContext('2d');
            
            // Przygotuj dane do wykresu
            const datasets = goals.map(goal => ({
                label: `${goal.measurementType} (${goal.currentValue} → ${goal.targetValue} ${goal.measurementType === 'weight' ? 'kg' : 'cm'})`,
                data: [
                    { x: new Date(goal.startDate), y: goal.currentValue },
                    { x: new Date(goal.endDate), y: goal.targetValue }
                ],
                borderColor: getRandomColor(),
                backgroundColor: 'transparent',
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#000',
                pointBorderWidth: 2,
                pointRadius: 4
            }));

            // Wspólne opcje dla wykresu
            const commonOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'dd.MM.yyyy'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            };

            goalsChart = new Chart(ctx, {
                type: 'line',
                data: { datasets },
                options: commonOptions
            });
        }

        // Funkcja pomocnicza do generowania losowych kolorów
        function getRandomColor() {
            const colors = [
                '#4CAF50', '#2196F3', '#FFC107', '#F44336', 
                '#9C27B0', '#FF9800', '#795548', '#607D8B'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        // Funkcja do aktualizacji pasków postępu
        function updateProgressBars() {
            document.querySelectorAll('.progress-bar').forEach(bar => {
                const progress = bar.getAttribute('aria-valuenow');
                bar.style.width = `${progress}%`;
            });
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Inicjalizacja skryptu goals.js...');
            
            // Inicjalizacja tooltipów
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });

            // Aktualizacja pasków postępu
            updateProgressBars();

            // Inicjalizacja formularza celu
            if (goalForm) {
                console.log('Inicjalizacja formularza celu');
                
                // Obsługa zmiany typu pomiaru
                const measurementType = document.getElementById('measurementType');
                if (measurementType) {
                    measurementType.addEventListener('change', function() {
                        const unit = this.value === 'weight' ? 'kg' : 'cm';
                        document.querySelectorAll('.measurement-unit').forEach(el => el.textContent = unit);
                    });
                }

                // Obsługa dodawania nowego celu
                goalForm.addEventListener('submit', async function(e) {
                    console.log('Zdarzenie submit formularza celu');
                    e.preventDefault();
                    await saveGoal();
                });
            } else {
                console.error('Nie znaleziono formularza celu!');
            }

            // Obsługa przycisku zapisywania w modalu
            const goalModalSubmit = document.getElementById('goalModalSubmit');
            console.log('Przycisk zapisywania w modalu:', goalModalSubmit);
            
            if (goalModalSubmit) {
                console.log('Dodaję obsługę przycisku zapisywania w modalu');
                goalModalSubmit.addEventListener('click', async function(e) {
                    console.log('Kliknięto przycisk zapisywania w modalu');
                    e.preventDefault();
                    const goalId = goalForm.dataset.goalId;
                    console.log('ID celu do zapisania:', goalId);
                    await saveGoal(goalId);
                });
            } else {
                console.error('Nie znaleziono przycisku zapisywania w modalu!');
            }
            
            // Obsługa edycji i usuwania celów
            const goalsTableBody = document.getElementById('goalsTableBody');
            if (goalsTableBody) {
                console.log('Dodaję obsługę przycisków edycji i usuwania celów');
                goalsTableBody.addEventListener('click', function(e) {
                    const editBtn = e.target.closest('.edit-goal');
                    const deleteBtn = e.target.closest('.delete-goal');
                    
                    if (editBtn) {
                        console.log('Kliknięto przycisk edycji celu');
                        const goalId = editBtn.dataset.goalId;
                        console.log('ID celu do edycji:', goalId);
                        editGoal(goalId);
                    } else if (deleteBtn) {
                        console.log('Kliknięto przycisk usuwania celu');
                        const goalId = deleteBtn.dataset.goalId;
                        console.log('ID celu do usunięcia:', goalId);
                        deleteGoal(goalId);
                    }
                });
            } else {
                console.error('Nie znaleziono tabeli celów!');
            }

            // Obsługa filtrowania
            filterGoalStatus.addEventListener('change', filterGoals);

            // Reset formularza przy zamknięciu modalu
            if (goalModal) {
                console.log('Dodaję obsługę zamknięcia modalu');
                goalModal.addEventListener('hidden.bs.modal', function() {
                    console.log('Modal został zamknięty, resetuję formularz');
                    if (goalForm) {
                        goalForm.reset();
                        // Usuń ID celu z formularza
                        delete goalForm.dataset.goalId;
                        // Resetuj tytuł modalu
                        const modalTitle = document.getElementById('goalModalTitle');
                        if (modalTitle) modalTitle.textContent = 'Dodaj cel';
                        // Resetuj obsługę przycisku zapisywania
                        if (goalModalSubmit) {
                            goalModalSubmit.onclick = null;
                        }
                    }
                    if (goalFormError) goalFormError.classList.add('d-none');
                    document.querySelectorAll('.measurement-unit').forEach(el => el.textContent = 'kg');
                });
            }

            // Inicjalizacja wykresu
            const goals = Array.from(document.querySelectorAll('.goal-card')).map(card => ({
                measurementType: card.querySelector('.goal-details h4').textContent.split(': ')[1],
                currentValue: parseFloat(card.querySelector('.current-value .value').textContent),
                targetValue: parseFloat(card.querySelector('.target-value .value').textContent),
                startDate: card.querySelector('.date-range').textContent.split(' - ')[0],
                endDate: card.querySelector('.date-range').textContent.split(' - ')[1]
            }));

            if (goals.length > 0) {
                updateGoalsChart(goals);
            }

            // Inicjalizacja formularza głównego celu
            const mainGoalForm = document.getElementById('mainGoalForm');
            if (mainGoalForm) {
                mainGoalForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const goal = this.goal.value;
                    
                    try {
                        const response = await fetch('/api/user/goal', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ goal })
                        });

                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.message || 'Wystąpił błąd podczas aktualizacji celu');
                        }

                        const result = await response.json();
                        if (result.success) {
                            // Pokaż komunikat o sukcesie
                            alert('Cel został zaktualizowany pomyślnie');
                            // Odśwież stronę, aby zobaczyć zmiany
                            window.location.reload();
                        } else {
                            throw new Error(result.message || 'Wystąpił błąd podczas aktualizacji celu');
                        }
                    } catch (error) {
                        console.error('Błąd podczas aktualizacji celu:', error);
                        alert(error.message || 'Wystąpił błąd podczas aktualizacji celu. Spróbuj ponownie.');
                    }
                });
            }

            console.log('Inicjalizacja skryptu goals.js zakończona');
        });
    }

    // Eksportuj funkcję do globalnego zakresu
    window.initializeGoals = initializeGoals;

    // Automatyczna inicjalizacja po załadowaniu DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM załadowany, inicjalizacja skryptu goals.js...');
            initializeGoals();
        });
    } else {
        console.log('DOM już załadowany, inicjalizacja skryptu goals.js...');
        initializeGoals();
    }
})(); 