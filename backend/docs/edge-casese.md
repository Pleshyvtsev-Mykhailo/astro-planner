# Крайні випадки та обробка помилок

| № | Випадок | Поведінка системи | Оброблено | Доказ |
|---|---|---|---|---|
| 1 | Полярний день (Тромсе, 21.06) | Темряви 0 годин, жоден об'єкт не видно, помилки немає | Так | VisibilityApiTests.Tromso_InJune_HasNoDarkness_AndNothingIsVisible |
| 2 | Об'єкт, що ніколи не сходить або завжди над горизонтом | У відповіді поле horizon: NeverRises або AlwaysAbove | Так | AstroMathTests.ClassifyHorizon_GivesExpectedKind, VisibilityApiTests.Tromso_InDecember_M81IsAlwaysAboveHorizon |
| 3 | Невалідні координати та дати | 400 із поясненням | Так | VisibilityApiTests.Visibility_InvalidInput_ReturnsBadRequest, LocationsApiTests.Create_OutOfRangeCoordinates_ReturnsBadRequest |
| 4 | Порожні або відсутні дані, порожній каталог | Відсутні поля дають 400, порожній каталог дає порожній список без помилки | Так | ObjectsApiTests.Create_MissingFields_ReturnsBadRequest, EmptyCatalogApiTests.EmptyCatalog_ReturnsEmptyLists |
| 5 | Межові значення | Широта ±90, довгота ±180, дати 1900-01-01 та 2100-12-31 приймаються; трохи за межами (90.01, −180.01, 2101 рік) дають 400 | Так | BoundaryApiTests (Visibility_AtBoundaryValues_ReturnsOk, Visibility_JustOutsideBoundary_ReturnsBadRequest, Location_AtBoundaryCoordinates_IsAccepted) |
| 6 | Прострочений або підроблений токен | 401, доступ не надається | Так | AuthApiTests.ExpiredToken_IsRejected, TokenServiceTests.TokenSignedWithAnotherKey_IsRejected |

## Знайдена і виправлена помилка
Тест граничних значень виявив, що широта 90.01 приймалась: атрибут Range(-90, 90) із цілими межами округлює значення до цілого перед перевіркою. Межі в усіх DTO замінено на дробові (-90.0, 90.0 тощо), після чого 90.01 і −180.01 дають 400.

## Відповідність пунктам критерію C2

1. Валідація введення: атрибути перевірки у DTO, автоматичний 400. Межі перевірено тестами.
2. Порожні або некоректні дані: випадки 3 і 4.
3. Винятки без аварійного завершення: глобальний обробник помилок, клієнт отримує коротку відповідь без технічних подробиць. Окремого автотесту немає, перевірено прогоном і лог-файлом.
4. Межові значення: випадок 5.
5. Відсутність необроблених винятків у лог-файлі прогону: docs/run-log.txt.