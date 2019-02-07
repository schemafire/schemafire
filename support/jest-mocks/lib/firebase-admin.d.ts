/// <reference types="jest" />
export declare const snapData: {
    data: jest.Mock<any, any>;
    exists: boolean;
    id: string;
    ref: jest.Mock<{}, []>;
    createTime: undefined;
    updateTime: undefined;
    readTime: undefined;
    get: jest.Mock<any, any>;
};
export declare const snap: jest.Mock<{
    data: jest.Mock<any, any>;
    exists: boolean;
    id: string;
    ref: jest.Mock<{}, []>;
    createTime: undefined;
    updateTime: undefined;
    readTime: undefined;
    get: jest.Mock<any, any>;
}, []>;
export declare const get: jest.Mock<{
    snap: jest.Mock<{
        data: jest.Mock<any, any>;
        exists: boolean;
        id: string;
        ref: jest.Mock<{}, []>;
        createTime: undefined;
        updateTime: undefined;
        readTime: undefined;
        get: jest.Mock<any, any>;
    }, []>;
}, []>;
export declare const docData: {
    get: jest.Mock<{
        snap: jest.Mock<{
            data: jest.Mock<any, any>;
            exists: boolean;
            id: string;
            ref: jest.Mock<{}, []>;
            createTime: undefined;
            updateTime: undefined;
            readTime: undefined;
            get: jest.Mock<any, any>;
        }, []>;
    }, []>;
    id: string;
};
export declare const doc: jest.Mock<{
    get: jest.Mock<{
        snap: jest.Mock<{
            data: jest.Mock<any, any>;
            exists: boolean;
            id: string;
            ref: jest.Mock<{}, []>;
            createTime: undefined;
            updateTime: undefined;
            readTime: undefined;
            get: jest.Mock<any, any>;
        }, []>;
    }, []>;
    id: string;
}, []>;
export declare const limit: jest.Mock<any, any>;
export declare const collectionGet: any;
export declare const where: any;
export declare const collectionRef: {
    doc: jest.Mock<{
        get: jest.Mock<{
            snap: jest.Mock<{
                data: jest.Mock<any, any>;
                exists: boolean;
                id: string;
                ref: jest.Mock<{}, []>;
                createTime: undefined;
                updateTime: undefined;
                readTime: undefined;
                get: jest.Mock<any, any>;
            }, []>;
        }, []>;
        id: string;
    }, []>;
    where: any;
    limit: jest.Mock<any, any>;
    get: any;
};
export declare const collection: any;
export declare const runTransaction: jest.Mock<Promise<any>, any>;
export declare const firestore: any;
declare const admin: {
    auth(): {
        verifySessionCookie(cookie: string): Promise<{
            uid: string;
        }>;
    };
    credential: {
        cert: jest.Mock<any, any>;
    };
    firestore: any;
    initializeApp: jest.Mock<{
        auth(): {
            verifySessionCookie(cookie: string): Promise<{
                uid: string;
            }>;
        };
        credential: {
            cert: jest.Mock<any, any>;
        };
        firestore: any;
    }, []>;
};
export default admin;
//# sourceMappingURL=firebase-admin.d.ts.map