# Приймальні тест-кейси

Фіксований список із 15 кейсів. Кожен спирається на один чи кілька автоматичних тестів. Усього в проєкті 100 автотестів: цей список це зрозуміла людині вибірка основних сценаріїв, а не перелік кожного тесту.

Запуск: dotnet test у папці backend.
Останній прогін: 100 з 100 тестів пройдено, дата 16.11.2026


| № | Кейс | Очікуваний результат | Автотест | Результат |
|---|---|---|---|---|
| AC-01 | Отримати каталог | 200, у каталозі не менше 20 об'єктів | ObjectsApiTests.GetAll_ReturnsSeededObjects | Пройдено |
| AC-02 | Фільтр за типом Galaxy | Лише галактики | ObjectsApiTests.GetAll_FilterByType_ReturnsOnlyThatType | Пройдено |
| AC-03 | Сортування за яскравістю | Першим іде M45 | ObjectsApiTests.GetAll_SortByMagnitude_StartsWithBrightestObject | Пройдено |
| AC-04 | Пошук M31 | M31 є у відповіді | ObjectsApiTests.GetAll_Search_FindsByName | Пройдено |
| AC-05 | Адмін створює об'єкт, дубль відхиляється | 201, повторне створення 409 | ObjectsApiTests.Create_AsAdmin_Succeeds_AndDuplicateIsConflict | Пройдено |
| AC-06 | Звичайний користувач змінює каталог | Без токена 401, зі звичайною роллю 403 | ObjectsApiTests.Create_WithoutToken_ReturnsUnauthorized, Create_AsRegularUser_ReturnsForbidden | Пройдено |
| AC-07 | Реєстрація та вхід | Реєстрація 201, вхід 200 з токеном, хибний пароль 401 | AuthApiTests.Register_CreatesUser_AndDuplicateIsConflictIgnoringCase, Login_AsAdmin_ReturnsTokenWithAdminRole, Login_WithWrongPassword_ReturnsUnauthorized | Пройдено |
| AC-08 | Журнал: свої записи й записи адміна | Користувач бачить лише свої, адмін бачить усі | ObservationsApiTests.List_UserSeesOnlyOwnRecords_AdminSeesAll | Пройдено |
| AC-09 | Чужий запис журналу | Читання, зміна й видалення чужого запису дають 403 | ObservationsApiTests.OtherUser_CannotReadChangeOrDeleteForeignRecord | Пройдено |
| AC-10 | Видимість у Києві 15.11.2026 | 20 об'єктів, 10–15 годин темряви, M31 видно з висотою понад 70° | VisibilityApiTests.Kyiv_InNovember_HasLongNightAndSeesM31 | Пройдено |
| AC-11 | Видимість у Тромсе 21.06.2026 | Темряви немає, жоден об'єкт не видно | VisibilityApiTests.Tromso_InJune_HasNoDarkness_AndNothingIsVisible | Пройдено |
| AC-12 | Невалідний запит видимості | Хибні координати, дата чи параметри дають 400, невідомий об'єкт 404 | VisibilityApiTests.Visibility_InvalidInput_ReturnsBadRequest, Visibility_UnknownObject_ReturnsNotFound | Пройдено |
| AC-13 | Звичайний користувач додає місце | Зі входом 201, без токена 401, видалити місце не може (403) | LocationsApiTests.Create_AsRegularUser_Succeeds, Create_WithoutToken_ReturnsUnauthorized, Delete_AsRegularUser_ReturnsForbidden | Пройдено |
| AC-14 | Власник керує своїм записом журналу | Зміна й видалення свого запису 204, повторне читання 404 | ObservationsApiTests.Owner_CanUpdateAndDelete | Пройдено |
| AC-15 | Видалення об'єкта, який є в журналі | 409, дані журналу не втрачаються | ObservationsApiTests.DeleteObjectUsedInLog_ReturnsConflict | Пройдено |