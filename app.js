new Vue({
    el: '#app',
    data: {
        newKey: '',
        keys: [],
        primaryKey: '',
        valueRows: [],
        jsonOutput: ''
    },
    methods: {
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
            // 키가 삭제되면 모든 값 행에서 해당 키-값 쌍을 제거합니다.
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
            this.checkForDuplicates(); // 행 삭제 후 중복 재검사
        },
        checkForDuplicates(rowIndex, key) {
            // 현재 변경된 키가 고유 키가 아니면 검사하지 않습니다.
            if (key && key !== this.primaryKey) {
                return;
            }

            const primaryKeyValues = this.valueRows.map(row => row[this.primaryKey]).filter(val => val);
            const uniqueValues = new Set(primaryKeyValues);

            if (primaryKeyValues.length !== uniqueValues.size) {
                const duplicateValue = this.findDuplicate(primaryKeyValues);
                // 사용자에게 중복 사실을 알리고 수정을 요청합니다.
                alert(`'${this.primaryKey}' 키의 값 '${duplicateValue}'가 중복되었습니다. 수정해주세요.`);
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
            // 빈 값을 가진 행은 필터링할 수 있습니다 (선택 사항).
            const nonEmptyRows = this.valueRows.filter(row => 
                Object.values(row).some(val => val !== '')
            );

            if (nonEmptyRows.length === 0) {
                alert("입력된 값이 없습니다.");
                return;
            }
            
            this.checkForDuplicates(); // 생성 전 최종 중복 검사
            const primaryKeyValues = nonEmptyRows.map(row => row[this.primaryKey]).filter(val => val);
            if (primaryKeyValues.length !== new Set(primaryKeyValues).size) {
                 alert(`고유 키 '${this.primaryKey}'에 중복된 값이 있습니다. JSON을 생성할 수 없습니다.`);
                 return;
            }

            this.jsonOutput = JSON.stringify(nonEmptyRows, null, 2);
        },
        copyJson() {
            if (!this.jsonOutput) return;
            navigator.clipboard.writeText(this.jsonOutput).then(() => {
                alert('JSON이 클립보드에 복사되었습니다.');
            }).catch(err => {
                console.error('복사 실패:', err);
                alert('클립보드 복사에 실패했습니다.');
            });
        }
    },
    watch: {
        // 고유 키가 변경되면, 기존 값들의 중복을 다시 검사합니다.
        primaryKey(newPrimaryKey, oldPrimaryKey) {
            if (newPrimaryKey) {
                this.checkForDuplicates();
            }
        },
        // 키 목록이 변경되면, 값 행들의 구조를 동기화합니다.
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
