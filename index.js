const ref = require('ref-napi');
const ffi = require('ffi-napi');

class FtStatus {}
FtStatus.ok = 0;
FtStatus.invalidHandle = 1;
FtStatus.deviceNotFound = 2;
FtStatus.deviceNotOpened = 3;
FtStatus.ioError = 4;
FtStatus.insufficientResources = 5;
FtStatus.invalidParameter = 6;
FtStatus.invalidBaudRate = 7;
FtStatus.deviceNotOpenedForErase = 8;
FtStatus.deviceNotOpenedForWrite = 9;
FtStatus.failedToWriteDevice = 10;
FtStatus.eepromReadFailed = 11;
FtStatus.eepromWriteFailed = 12;
FtStatus.eepromEraseFailed = 13;
FtStatus.eepromNotPresent = 14;
FtStatus.eepromNotProgrammed = 15;
FtStatus.invalidArgs = 16;
FtStatus.otherError = 17;

class OpenDmx {
    constructor() {
        this.buffer = [];
        this.handle = 0;
        this.done = false;
        this.bytesWritten = 0;
        this.status = null;

        this.bits8 = 8;
        this.stopBits2 = 2;
        this.parityNone = 0;
        this.flowNone = 0;
        this.purgeRx = 1;
        this.purgeTx = 2;

        this._handlePointer = ref.refType(ref.types.uint);
        this._lpBufferPointer = ref.refType(ref.types.int);
        this._byteWrittenPointer = ref.refType(ref.types.int);

        this.binding = ffi.Library('./FTD2XX.dll', {
            'FT_Open': ['int', ['uint32', this._handlePointer]],
            'FT_Write': ['int', ['uint', this._lpBufferPointer, 'uint32', this._byteWrittenPointer]],
            'FT_SetDataCharacteristics': ['int', ['uint', 'byte', 'byte', 'byte']],
            'FT_SetFlowControl': ['int', ['uint', 'char', 'byte', 'byte']],
            'FT_Purge': ['int', ['uint', 'uint32']],
            'FT_ClrRts': ['int', ['uint']],
            'FT_SetBreakOn': ['int', ['uint']],
            'FT_SetBreakOff': ['int', ['uint']],
            'FT_ResetDevice': ['int', ['uint']],
            'FT_SetDivisor': ['int', ['uint', 'char']],
        });
    }

    start() {
        this.handle = 0;

        let handleBuffer = Buffer.alloc(4);
        handleBuffer.writeUintLE(this.handle, 0, 4);
        handleBuffer.type = ref.types.uint;

        this.status = this.binding.FT_Open(1, handleBuffer);
        this.handle = handleBuffer.deref();
    }

    setDmxValue(channel, value) {
        this.buffer[channel] = value;
    }

    writeData() {
        try {
            this.initOpenDmx();

            console.log('this.status:', this.status);
            console.log('FtStatus.ok:', FtStatus.ok);

            // if (this.status === FtStatus.ok) {
                this.binding.FT_SetBreakOn(this.handle);
                this.binding.FT_SetBreakOff(this.handle);

                this.bytesWritten = this.write(this.handle, this.buffer, this.buffer.length);
            // }
        } catch (err) {
            console.error('Failed to write data:', err);
        }
    }

    write(handle, data, length) {
        let lpBufferPointer = ref.alloc(this._lpBufferPointer);
        lpBufferPointer.copy(data, 0, 0, length);

        let byteWrittenPointer = ref.alloc(this._byteWrittenPointer);

        this.status = this.binding.FT_Write(handle, lpBufferPointer, length, byteWrittenPointer);

        console.log('byteWrittenPointer:', byteWrittenPointer);

        return byteWrittenPointer.deref();
    }

    initOpenDmx() {
        this.status = this.binding.FT_ResetDevice(this.handle);
        this.status = this.binding.FT_SetDivisor(this.handle, 12);
        this.status = this.binding.FT_SetDataCharacteristics(this.handle, this.bits8, this.stopBits2, this.parityNone);
        this.status = this.binding.FT_SetFlowControl(this.handle, this.flowNone, 0, 0);
        this.status = this.binding.FT_ClrRts(this.handle);
        this.status = this.binding.FT_Purge(this.handle, this.purgeTx);
        this.status = this.binding.FT_Purge(this.handle, this.purgeRx);
    }
}

const openDmx = new OpenDmx();
openDmx.start();

// console.log('status:', openDmx.status);
// console.log('handle:', openDmx.handle);
// console.log('buffer:', openDmx.buffer);
// console.log('bytesWritten:', openDmx.bytesWritten);

openDmx.setDmxValue(0, 255);
openDmx.setDmxValue(1, 255);
openDmx.setDmxValue(2, 255);
openDmx.setDmxValue(3, 255);

openDmx.writeData();

// console.log('status:', openDmx.status);
// console.log('handle:', openDmx.handle);
// console.log('buffer:', openDmx.buffer);
// console.log('bytesWritten:', openDmx.bytesWritten);