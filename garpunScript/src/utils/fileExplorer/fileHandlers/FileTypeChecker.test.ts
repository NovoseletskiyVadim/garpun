const { FileTypeChecker } = require('./FileTypeChecker');

describe('checkFileName', () => {
    test('Name should be pass', () => {
        const result = new FileTypeChecker(
            'C:\\Users\\Alex\\Documents\\vadim\\garpun\\garpunScript\\tests\\test_media\\badType.jpg'
        ).execute();

        expect(result).toBe(true);
    });
});
