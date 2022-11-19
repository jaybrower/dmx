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

FtStatus.getName = (status) => {
    switch (status) {
        case FtStatus.ok: {
            return 'OK';
        }
        case FtStatus.invalidHandle: {
            return 'Invalid Handle';
        }
        case FtStatus.deviceNotFound: {
            return 'Device Not Found';
        }
        case FtStatus.deviceNotOpened: {
            return 'Device Not Opened';
        }
        case FtStatus.ioError: {
            return 'IO Error';
        }
        case FtStatus.insufficientResources: {
            return 'Insufficient Resources';
        }
        case FtStatus.invalidParameter: {
            return 'Invalid Parameter';
        }
        case FtStatus.invalidBaudRate: {
            return 'Invalid Baud Rate';
        }
        case FtStatus.deviceNotOpenedForErase: {
            return 'Device Not Opened For Erase';
        }
        case FtStatus.deviceNotOpenedForWrite: {
            return 'Device Not Opened For Write';
        }
        case FtStatus.failedToWriteDevice: {
            return 'Failed To Write To Device';
        }
        case FtStatus.eepromReadFailed: {
            return 'EEPROM Read Failed';
        }
        case FtStatus.eepromWriteFailed: {
            return 'EEPROM Write Failed';
        }
        case FtStatus.eepromEraseFailed: {
            return 'EEPROM Erase Failed';
        }
        case FtStatus.eepromNotPresent: {
            return 'EEPROM Not Present';
        }
        case FtStatus.eepromNotProgrammed: {
            return 'EEPROM Not Programmed';
        }
        case FtStatus.invalidArgs: {
            return 'Invalid Args';
        }
        case FtStatus.otherError:
        default: {
            return 'Other Error';
        }
    }
};

class OpenDmx {
    constructor() {
        this.buffer = new Uint8Array(513);
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

        this.binding = ffi.Library('./FTD2XX.dll', {
            'FT_Open': ['int', ['uint32', ref.refType(ref.types.uint)]],
            'FT_Write': ['int', ['uint', 'CString', 'uint32', ref.refType(ref.types.int)]],
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
        const handlePointer = ref.alloc('uint');

        this.status = this.binding.FT_Open(0, handlePointer);
        this.handle = handlePointer.deref();

        this.initOpenDmx();
    }

    setDmxValue(channel, value) {
        this.buffer[channel] = value;
    }

    writeData() {
        try {
            if (this.status === FtStatus.ok) {
                this.binding.FT_SetBreakOn(this.handle);
                this.binding.FT_SetBreakOff(this.handle);

                this.bytesWritten = this.write(this.buffer, this.buffer.length);
            } else {
                console.warn(`Unable to write data because status is "${FtStatus.getName(this.status)}" but needs to be "${FtStatus.getName(FtStatus.ok)}"`);
            }
        } catch (err) {
            console.error('Failed to write data:', err);
        }
    }

    write(data, length) {
        // const dataPointer = Buffer.from(data);
        // const dataPointerAddress = '0x' + dataPointer.hexAddress();
        // const dataPointerAddressPointer = ref.alloc(ref.types.CString, dataPointerAddress);

        // const dataPointer = '0x' + Buffer.from(data).toString('hex');
        // const dataPointerAddressPointer = ref.alloc(ref.types.CString, dataPointer);

        const dataPointerAddressPointer = ref.allocCString('[0,255,255]');

        // console.log('data:', data);
        // console.log('dataPointer:', dataPointer);

        const byteWrittenPointer = Buffer.alloc(4);
        byteWrittenPointer.writeUintLE(this.bytesWritten, 0, 4);
        byteWrittenPointer.type = ref.types.uint;

        this.status = this.binding.FT_Write(this.handle, dataPointerAddressPointer, length, byteWrittenPointer);

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

switch (openDmx.status) {
    case FtStatus.ok: {
        console.log('Found DMX on USB');

        openDmx.setDmxValue(1, 150);
        openDmx.setDmxValue(2, 150);
        openDmx.setDmxValue(3, 150);
        openDmx.setDmxValue(4, 150);

        setInterval(() => {
            openDmx.writeData();
        }, 10);

        break;
    }
    case FtStatus.deviceNotFound: {
        console.warn('No Enttec USB device found');
        break;
    }
    default: {
        console.warn(`Error opening device with status of "${FtStatus.getName(openDmx.status)}"`);
        break;
    }
}