# Журнал команд Zai-agent-toolkit

> Последнее обновление: 2026-05-17
> Назначение: Быстрый справочник команд для работы с toolkit

---

## 1. Синхронизация

### Windows (ZCode Desktop)

```powershell
# Способ 1: Быстрая команда (после настройки алиаса)
sync-toolkit

# Способ 2: Прямой запуск скрипта
.\sync-toolkit.ps1

# Способ 3: Ручной git pull
cd C:\Users\stsgr\.zcode\Zai-agent-toolkit
git pull
```

### Linux (Z.ai sandbox)

```bash
# Push изменений в GitHub
git add .
git commit -m "описание изменений"
git push origin main
```

---

## 2. Skills - основные команды

### Создание skill с ID

```bash
# Шаблон структуры
skills/
└── my-skill_sts/           # _sts - подпись пользователя
    └── SKILL.md            # ID: ZAI-STS-XXX
```

### Назначение ID skill

Формат: `ZAI-<DOMAIN>-<NUMBER>`

| Domain | Код | Пример |
|--------|-----|--------|
| Персональные (STS) | STS | ZAI-STS-001 |
| Архитектура | ARCH | ZAI-ARCH-001 |
| Git | GIT | ZAI-GIT-001 |
| Разработка | DEV | ZAI-DEV-001 |
| Мета-системы | META | ZAI-META-001 |

### Реестр skills

Файл: `skills/skill-id-system/SKILL.md` -> секция Registry

---

## 3. Пути и расположение

### Windows

```
C:\Users\stsgr\.zcode\Zai-agent-toolkit\     # Репозиторий toolkit
C:\Users\stsgr\.zcode\skills\                 # Symbolic link -> toolkit/skills
```

### Linux (Z.ai)

```
/home/z/my-project/Zai-agent-toolkit/         # Toolkit (клон репозитория)
/home/z/my-project/skills/                    # Skills в sandbox
```

---

## 4. Типичный workflow

### Создание нового skill

1. Создать папку: `skills/new-skill_sts/`
2. Создать файл: `SKILL.md` с содержимым
3. Добавить ID в заголовок: `# Skill Name [ZAI-STS-XXX]`
4. Обновить реестр в `skill-id-system/SKILL.md`
5. Push: `git add . && git commit -m "add new-skill_sts" && git push`

### Обновление skills на Windows

1. В Linux: `git push` изменений
2. В Windows: `sync-toolkit` или `git pull`
3. Перезапустить ZCode Desktop (если нужно)

---

## 5. Шпаргалка Git

```bash
# Проверить статус
git status

# Добавить все изменения
git add .

# Закоммитить
git commit -m "сообщение"

# Отправить
git push origin main

# Получить изменения
git pull origin main

# История коммитов
git log --oneline -10
```

---

## 6. Настройка команд Windows (один раз)

### Автоматическая настройка

```powershell
# Запустить один раз в PowerShell:
cd C:\Users\stsgr\.zcode\Zai-agent-toolkit
.\scripts\setup-sync-command.ps1

# Перезапустить PowerShell
```

После этого команды заработают везде:

| Команда | Действие |
|---------|----------|
| `sync-toolkit` | Обновить toolkit из GitHub |
| `goto-toolkit` | Перейти в папку toolkit |
| `list-skills` | Показать все skills |

### Ручная настройка (если нужно)

Добавить в PowerShell profile (`notepad $PROFILE`):

```powershell
function sync-toolkit {
    Set-Location C:\Users\stsgr\.zcode\Zai-agent-toolkit
    git pull
    Write-Host "Toolkit updated!" -ForegroundColor Green
}
```

---

## 7. Документация toolkit

| Файл | Назначение |
|------|------------|
| `docs/TUTORIAL.md` | Полное обучение по toolkit |
| `docs/SKILL_ID_GUIDE.md` | Справочник по ID системе |
| `docs/COMMANDS_LOG.md` | Этот журнал команд |
| `skills/skill-id-system/SKILL.md` | Реестр всех skills |
| `skills/skill-creator/SKILL.md` | Инструкции по созданию skills |

---

## 8. Быстрые команды "для памяти"

| Что сделать | Команда |
|------------|---------|
| Обновить skills на Win | `sync-toolkit` |
| Push изменений | `git add . && git commit -m "msg" && git push` |
| Посмотреть skills | `ls skills/` (Linux) или `list-skills` (Win) |
| Найти skill по ID | `grep -r "ZAI-STS" skills/` |
| Открыть PowerShell profile | `notepad $PROFILE` |

---

## 9. Реестр назначенных ID

| ID | Skill | Описание |
|----|-------|----------|
| ZAI-META-001 | skill-id-system | Система ID для skills |
| ZAI-META-002 | skill-creator | Создание и оптимизация skills |
| ZAI-STS-001 | prompt-engineering_sts | Prompt engineering техники |
| ZAI-DEV-002 | anti-monolith | Модульная архитектура React/Next.js |

---

*Журнал ведётся с 2026-05-17. Добавляйте новые команды по мере работы.*
