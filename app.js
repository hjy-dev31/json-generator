new Vue({
    el: '#app',
    data: {
        newKey: '',
        keys: [],
        primaryKey: '',
        valueRows: [],
        jsonOutput: '',
        lang: 'ko', // 기본 언어
        translations: {
            en: {
                title: "JSON Generator",
                step1: "1. Enter JSON Keys",
                keyPlaceholder: "Enter a key and press Enter",
                add: "Add",
                step2: "2. Select Unique Key",
                selectPkPlaceholder: "Select a key to use as the unique key",
                step3: "3. Enter Values",
                valueDescription: "Each row will become a JSON object. The value for the unique key '{{primaryKey}}' cannot be duplicated.",
                actions: "Actions",
                removeRow: "Remove Row",
                addRow: "Add Row",
                step4: "4. Generate JSON",
                generateJson: "Generate JSON",
                generatedJson: "Generated JSON:",
                copy: "Copy",
                duplicatePkAlert: "The value '{{duplicateValue}}' for the key '{{primaryKey}}' is duplicated. Please correct it.",
                noValuesAlert: "No values entered.",
                duplicatePkGenerateAlert: "There are duplicate values for the unique key '{{primaryKey}}'. Cannot generate JSON.",
                copySuccessAlert: "JSON copied to clipboard.",
                copyFailAlert: "Failed to copy to clipboard."
            },
            ko: {
                title: "JSON 생성기",
                step1: "1. JSON 키 입력",
                keyPlaceholder: "키를 입력하고 Enter를 누르세요",
                add: "추가",
                step2: "2. 고유 키 선택",
                selectPkPlaceholder: "고유 키로 사용할 키를 선택하세요",
                step3: "3. 값 입력",
                valueDescription: "각 행은 하나의 JSON 객체가 됩니다. 고유 키 '{{primaryKey}}'의 값은 중복될 수 없습니다.",
                actions: "동작",
                removeRow: "행 삭제",
                addRow: "행 추가",
                step4: "4. JSON 생성",
                generateJson: "JSON 생성",
                generatedJson: "생성된 JSON:",
                copy: "복사",
                duplicatePkAlert: "'{{primaryKey}}' 키의 값 '{{duplicateValue}}'가 중복되었습니다. 수정해주세요.",
                noValuesAlert: "입력된 값이 없습니다.",
                duplicatePkGenerateAlert: "고유 키 '{{primaryKey}}'에 중복된 값이 있습니다. JSON을 생성할 수 없습니다.",
                copySuccessAlert: "JSON이 클립보드에 복사되었습니다.",
                copyFailAlert: "클립보드 복사에 실패했습니다."
            }
        }
    },
    created() {
        const userLang = navigator.language || navigator.userLanguage;
        this.lang = userLang.startsWith('en') ? 'en' : 'ko';
        document.documentElement.lang = this.lang; // Set html lang attribute
    },
    methods: {
        t(key, replacements = {}) {
            let text = (this.translations[this.lang] && this.translations[this.lang][key]) || key;
            for (const placeholder in replacements) {
                text = text.replace(new RegExp('{{' + placeholder + '}}', 'g'), replacements[placeholder]);
            }
            return text;
        },
        addKey() {
            const key = this.newKey.trim();
            if (key && !this.keys.includes(key)) {
                this.keys.push(key);
                this.newKey = '';
            }
        },
        removeKey(index) {
            const removedKey = this.keys.splice(index, 1)[0];
            if (this.primaryKey === removedKey) {
                this.primaryKey = '';
            }
            this.valueRows.forEach(row => {
                this.$delete(row, removedKey);
            });
        },
        addRow() {
            const newRow = {};
            this.keys.forEach(key => {
                this.$set(newRow, key, '');
            });
            this.valueRows.push(newRow);
        },
        removeRow(index) {
            this.valueRows.splice(index, 1);
            this.checkForDuplicates();
        },
        checkForDuplicates(rowIndex, key) {
            if (key && key !== this.primaryKey) {
                return;
            }

            const primaryKeyValues = this.valueRows.map(row => row[this.primaryKey]).filter(val => val);
            const uniqueValues = new Set(primaryKeyValues);

            if (primaryKeyValues.length !== uniqueValues.size) {
                const duplicateValue = this.findDuplicate(primaryKeyValues);
                alert(this.t('duplicatePkAlert', { primaryKey: this.primaryKey, duplicateValue: duplicateValue }));
            }
        },
        findDuplicate(arr) {
            const seen = new Set();
            for (const item of arr) {
                if (seen.has(item)) {
                    return item;
                }
                seen.add(item);
            }
        },
        generateJson() {
            const nonEmptyRows = this.valueRows.filter(row => 
                Object.values(row).some(val => val !== '')
            );

            if (nonEmptyRows.length === 0) {
                alert(this.t('noValuesAlert'));
                return;
            }
            
            this.checkForDuplicates();
            const primaryKeyValues = nonEmptyRows.map(row => row[this.primaryKey]).filter(val => val);
            if (primaryKeyValues.length !== new Set(primaryKeyValues).size) {
                 alert(this.t('duplicatePkGenerateAlert', { primaryKey: this.primaryKey }));
                 return;
            }

            this.jsonOutput = JSON.stringify(nonEmptyRows, null, 2);
        },
        copyJson() {
            if (!this.jsonOutput) return;
            navigator.clipboard.writeText(this.jsonOutput).then(() => {
                alert(this.t('copySuccessAlert'));
            }).catch(err => {
                console.error('Copy failed:', err);
                alert(this.t('copyFailAlert'));
            });
        }
    },
    watch: {
        primaryKey(newPrimaryKey, oldPrimaryKey) {
            if (newPrimaryKey) {
                this.checkForDuplicates();
            }
        },
        keys(newKeys, oldKeys) {
            const addedKeys = newKeys.filter(k => !oldKeys.includes(k));
            const removedKeys = oldKeys.filter(k => !newKeys.includes(k));

            this.valueRows.forEach(row => {
                addedKeys.forEach(key => {
                    this.$set(row, key, '');
                });
                removedKeys.forEach(key => {
                    this.$delete(row, key);
                });
            });

            if (this.valueRows.length === 0 && newKeys.length > 0) {
                this.addRow();
            }
        }
    }
});