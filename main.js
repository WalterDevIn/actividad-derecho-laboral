class Tools {

    static parsePercent(time, totalTime) {
        return time / totalTime * 100;
    }

    static parseTime(seconds) {
        return Math.floor(seconds / 60) + ":" + (seconds % 60 > 9 ? "" : "0") + seconds % 60;
    }
}

class View {

    constructor(element) {
        this.element = document.querySelector(element).cloneNode(true);
        this.body = document.querySelector("#root");
    }

    config() {}

    buildElements(...elementsName) {
        let className = elementsName.map(elementName => "." + elementName);
        let querys = elementsName.map(elementName => elementName.replace(/-./, selection => selection[1].toUpperCase()));
        for(let i = 0; i < querys.length; i ++)
            this[querys[i]] = document.querySelector(className[i]);
        console.log(this); 
    }

    init() {
        setTimeout(() => {
            this.config();
            this.element.classList.remove("inactive");
            this.body.innerHTML = "";
            this.body.appendChild(this.element);
            this.mountHandlers();
        }, 240)
        setTimeout(() => {
            document.body.classList.remove("transition");
        }, 480)
    }

    showTransition() {
        document.body.classList.remove("transition");
        document.body.classList.add("transition");
    }

    changeView(view) {
        this.showTransition();
        view.init();
    }

    mountHandlers() {}

}

class Menu extends View {

    constructor() {
        super(".menu");

        this.start = this.element.querySelector(".start");
        this.credits = this.element.querySelector(".credits-button");
    }

    handleStart() {
        this.changeView(new Exam());
    }

    mountHandlers() {
        this.start.addEventListener("click", () => this.handleStart());
        this.credits.addEventListener("click", () => this.changeView(new Credits()))
    }
    
}

class Exam extends View {

    constructor() {
        super(".exam");

        this.clock = this.element.querySelector(".clock");
        this.bar = this.element.querySelector(".bar");
        this.question = this.element.querySelector(".question");
        this.options = this.element.querySelector(".options");
        this.next = this.element.querySelector(".next");
        this.quit = this.element.querySelector(".quit");

        // PROPERTIES
        this.totalTime = 600; // Tiempo inicial (segundos)
        this.phases = [
            {
                question: "Que impacto genera en la economia?",
                options: ["Mayor participación en el mercado laboral", "Mayor estabilidad laboral", "Incremento de las inversiones extranjeras"]
            },
            {
                question: "Los trabajadores de contrato a tiempo parcial, pueden realizar horas extra?",
                options: ["No, no pueden", "Si, si pueden", "Pueden mientras esté establecido en el contrato"]
            },
            {
                question: "Cómo son las horas al día o a la semana en la qué se trabajará?",
                options: ["Inferior a una jornada habitual", "Mayor que las de una jornada habitual", "Iguales a las de una jornada habitual"]
            },
            {
                question: "Que beneficios otorga al trabajador?",
                options: ["Mayor flexibilidad horaria", "Igualdad de beneficios de un trabajador de jornada completa", "Mayor posibilidad de ascenso"]
            },
        ]; // Preguntas y opciones

        this.corrects = [0, 0, 0, 0]; // Indice de las respuestas correctas
        this.responses = []; // Respuestas anteriores
        this.result;
        
        this.currentTime = this.totalTime; // Tiempo restante
        this.currentOptions = []; // Arreglo de opciones presentes
        this.currentOptionsElements = [];
        this.currentFocus = null; // Ultima opción prescionada
        this.currentPhase = 0;
        
        this.optionsIsActive = []; // Opciones activas
        this.isAproved = false; // Estas aprovado
        this.hasTimeLeft = true; // Queda tiempo

        this.help = false;

        console.log(this)
    }

    config() {
        this.setBar();
        this.setClock();
        this.handleNext();
    }

    // SET & GET
    setBar() {
        let percent = Tools.parsePercent(this.currentTime, this.totalTime);
        this.bar.style.setProperty("--fill", `-${100 - percent}%`);
    }

    setClock() {
        this.clock.innerHTML = Tools.parseTime(this.currentTime);
    }

    calculeResults() {
        let rights = 0;
        for (let i = 0; this.responses.length > i; i++) this.responses[i] == this.corrects[i]? rights++: "";
        console.log(rights)
        console.log(this.corrects.length)
        const n = (rights / this.corrects.length * 10);
        return Math.trunc(n) + (n * 10 % 10) / 10;
    }

    generateOption(value, index) {
        const item = document.createElement(`li`);
        item.id = index;
        item.innerHTML = value;
        this.currentOptions.push(item);
        this.optionsIsActive.push(false);
        return item;
    }

    buildPhase({question, options}) {
        this.currentOptions = [];
        this.optionsIsActive = [];
        this.question.innerHTML = question;
        options.map((value, index) => {
            const option = this.generateOption(value, index)
            this.options.appendChild(option);
            this.currentOptionsElements.push(option)
        });
    }

    disableOptions() {
        this.optionsIsActive = this.optionsIsActive.map(optionState => false);
        this.currentOptionsElements.map(option => option.classList.remove("active"))
    }

    
    // HANDLERS
    handleTime() {
        if(!this.hasTimeLeft) {
            if(!this.help) {
                this.changeView(new Results(0))
            }
            this.help = true;
            return
        }
        this.setClock();
        this.setBar();
        this.currentTime--;
        this.hasTimeLeft = this.currentTime >= 0;
    }

    handleNext() {
        if (this.currentPhase >= this.phases.length) {
            this.responses.push(this.inFocus);
            this.responses.shift()
            console.log("responses: " + this.responses) 
            console.log("corrects: " + this.corrects)
            return this.changeView(new Results(this.calculeResults()));
        }
        if(!this.optionsIsActive.some(option => option) && this.currentPhase)
            return

        this.options.innerHTML = "";

        this.buildPhase(this.phases[this.currentPhase]);
        this.currentOptionsElements.map((option, index) => option.addEventListener("click", this.mountOptionHandler(option, index)));
        this.responses.push(this.inFocus);

        this.currentPhase++;
    }

    handleQuit() {
        this.changeView(new Menu());
    }

    mountOptionHandler(option, index) {
        return () => {
            this.disableOptions(); 
            option.classList.add("active");
            this.optionsIsActive[index] = true;
            this.inFocus = index % 3;
        }
    }

    //EVENTS
    mountHandlers() {
        this.currentOptionsElements.map((option, index) => option.addEventListener("click", this.mountOptionHandler(option, index)));
        this.next.addEventListener("click", () => this.handleNext());
        this.quit.addEventListener("click", () => this.handleQuit());
        setInterval(() => this.handleTime(), 1000);
    }

}

class Results extends View {

    constructor(points) {
        super(".result");

        this.buildElements("retry", "back", "credits-result");
        this.retry = this.element.querySelector(".retry");
        this.back = this.element.querySelector(".back");
        this.creditsResult = this.element.querySelector(".credits-result");
        this.nota = this.element.querySelector(".nota");
    
        this.nota.innerHTML = points;
    }

    handle() {
        console.log("works")
        this.changeView(new Exam()) 
    }

    mountHandlers() {
        this.retry.addEventListener("click", () => { this.changeView(new Exam())
        });
        this.back.addEventListener("click", () => { this.changeView(new Menu())})
        this.creditsResult.addEventListener("click", () => { this.changeView(new Credits()) })
    }

}

class Credits extends View {

    constructor() {
        super(".credits");
        this.back = this.element.querySelector(".back"); 
    }

    mountHandlers() {
        this.back.addEventListener("click", () => { this.changeView(new Menu())})
    }
}

//INIT
document.addEventListener("DOMContentLoaded", () => { new Menu().init(); })