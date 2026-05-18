# Как показать структуру папок в PowerShell

## Встроенная функция tree (PowerShell 7+)

В современных версиях PowerShell (начиная с 7.0) доступна встроенная функция `tree`, которая выводит структуру в удобном виде.

```powershell
tree
```

Для ограничения глубины отображения используйте параметр `-Depth`:

```powershell
tree -Depth 3
```

## Универсальный метод через Get-ChildItem

Если вы используете Windows PowerShell 5.1 или вам нужна гибкая фильтрация, применяйте командлет `Get-ChildItem`.

Базовый вывод всех файлов и папок:

```powershell
Get-ChildItem -Recurse -Name
```

> [INFO] Для вывода только папок добавьте параметр `-Directory`:

```powershell
Get-ChildItem -Recurse -Name -Directory
```

## Пример вывода структуры

Ниже показан пример того, как выглядит результат работы функции `tree` с использованием разрешенных ASCII-символов:

```
+--- src
|   +--- components
|   |   v Header.tsx
|   |   v Footer.tsx
|   +--- utils
|       v helpers.ts
+--- public
|   v index.html
v package.json
```

## Дополнительные параметры

- Используйте параметр `-Force`, чтобы показать скрытые файлы и папки
- Используйте параметр `-Exclude`, чтобы исключить определенные директории (например, `node_modules`)

```powershell
tree -Depth 3 -Force
Get-ChildItem -Recurse -Name -Exclude "node_modules"
```

---
Built with: PowerShell 7 + Markdown
