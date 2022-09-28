export class Utils { 

    static degrees2radians(degrees) {
        return degrees * Math.PI / 180;
    };

    static radians2degrees(radians) {
        return radians * 180 / Math.PI;
    };

    static distBetweenPoints(firstPointx, firstPointy, secondPointx, secondPointy) {
        var A = (firstPointx - secondPointx)
        var B = (firstPointy - secondPointy)
        var ASQ = Math.pow(A, 2)
        var BSQ = Math.pow(B, 2)
        var dist = Math.sqrt(ASQ + BSQ)
        return dist
    }

    static cloneObject(obj) {

        // deep clone obj and all its attributes
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        var temp = commandManager.createNew(obj.type, undefined);
        Object.assign(temp, obj);

        return temp;
    }
}