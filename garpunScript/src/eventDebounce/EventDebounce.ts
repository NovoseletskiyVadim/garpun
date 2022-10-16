
type CheckResult = {
    isSpam:boolean,
    calc:number,
}

export class EventDebounce {
    private static instance: EventDebounce;

    private eventStore = new Map();

    private TTC = 60000;

    private constructor() { }

    public static getInstance(): EventDebounce {
        if (!EventDebounce.instance) {
            EventDebounce.instance = new EventDebounce();
        }

        return EventDebounce.instance;
    }

    private addEvent(cameraName, plateNumber, calc) {
        const timer = setTimeout(() => {
            this.clean(cameraName);
        }, this.TTC);

        this.eventStore.set(
            cameraName,
            {
                calc,
                plateNumber,
                timer
            }
        );
    }

    private clean(cameraName) {
        this.eventStore.delete(cameraName);
    }

    check(cameraName:string, plateNumber:string):CheckResult {
        const event = this.eventStore.get(cameraName);
        let isSpam = false;
        let calc = 1;

        if (event && event.plateNumber === plateNumber) {
            calc += event.calc;
            this.clean(cameraName);
            isSpam = true;
        }
        this.addEvent(cameraName, plateNumber, calc);

        return {
            isSpam,
            calc
        };
    }
}
