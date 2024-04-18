const canvas = document.getElementById("canvas") as HTMLCanvasElement
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

const walls = new Map<Wall, Wall>()

type Axis = {x: number, y: number}
type EntityInitData = Axis & {w: number, h: number}

function restoreIntersectionPoints(player: Player, rotateAngle: number, radius: number) {
    RenderingEngine.rayPoints = []
    const r = radius
    const zeroPointAxis = {x: player.getAxis().x, y: player.getAxis().y - r}
    let axis = zeroPointAxis
    let updateAxis = {x: player.getAxis().x, y: player.getAxis().y - r}
    for(let n = 0; n < 360 / rotateAngle; n++) {
        for(let i = 0; i < RenderingEngine.rectLines.length; i++) {
            const x1 = player.getAxis().x
            const y1 = player.getAxis().y
            const x2 = axis.x
            const y2 = axis.y
            const x3 = RenderingEngine.rectLines[i].x1
            const y3 = RenderingEngine.rectLines[i].y1
            const x4 = RenderingEngine.rectLines[i].x2
            const y4 = RenderingEngine.rectLines[i].y2
            const determinedMatrix = (x2 - x1) * (y4 - y3) - (x4 - x3) * (y2 - y1)
            if(determinedMatrix === 0) {continue}
            const scala1 = (1 / determinedMatrix) * ((y3 - y4) * (x3 - x1) + (x4 - x3) * (y3 - y1)) * -1
            const scala2 = (1 / determinedMatrix) * ((y1 - y2) * (x3 - x1) + (x2 - x1) * (y3 - y1)) * -1
            if((scala1 < 1 && scala1 > 0) && (scala2 < 1 && scala2 > 0)) {
                const crossPointX = x1 + (x2 - x1) * scala1
                const crossPointY = y1 + (y2 - y1) * scala1
                if(Math.pow(updateAxis.x - player.getAxis().x, 2) + Math.pow(updateAxis.y - player.getAxis().y, 2) > Math.pow(crossPointX - player.getAxis().x, 2) + Math.pow(crossPointY - player.getAxis().y, 2)) {
                    updateAxis.x = crossPointX
                    updateAxis.y = crossPointY
                }
            }
        }
        RenderingEngine.rayPoints.push({x: updateAxis.x, y: updateAxis.y})
        const nextAxis = {
            x: ((axis.x - player.getAxis().x) * Math.cos(rotateAngle * Math.PI / 180) - (axis.y - player.getAxis().y) * Math.sin(rotateAngle * Math.PI / 180)) + player.getAxis().x, // + - 부호는 반대 왜냐하면 canvas는 왼쪽 상단이 0,0좌표
            y: ((axis.x - player.getAxis().x) * Math.sin(rotateAngle * Math.PI / 180) + (axis.y - player.getAxis().y) * Math.cos(rotateAngle * Math.PI / 180)) + player.getAxis().y
        }
        axis = nextAxis
        updateAxis.x = nextAxis.x
        updateAxis.y = nextAxis.y
    }
}


class Entity {
    x: number
    y: number
    h: number
    w: number
    constructor(initData: EntityInitData) {
        this.x = initData.x
        this.y = initData.y
        this.h = initData.h
        this.w = initData.w
    }
    getAxis() {
        const axis = {
            x: (this.x + this.w / 2),
            y: (this.y + this.h / 2)
        }
        return axis
    }
    getLine() {
        const lines = [
            new Line({x: this.x, y: this.y}, {x: this.x, y: (this.y + this.h)}),
            new Line({x: this.x, y: (this.y + this.h)}, {x: (this.x + this.w), y: (this.y + this.h)}),
            new Line({x: (this.x + this.w), y: (this.y + this.h)}, {x: (this.x + this.w), y: this.y}),
            new Line({x: (this.x + this.w), y: this.y}, {x: this.x, y: this.y})
        ]
        return lines
    }
}

const playerImageSize = 100
class Player extends Entity {
    constructor(initData: EntityInitData) {
        super(initData)
    }
    create() {
        ctx.save()
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, this.w, this.h)
        ctx.font = "20px sans-serif"
        ctx.textAlign = "left"
        ctx.restore()
    }
}
class Wall extends Entity {
    constructor(initData: EntityInitData) {
        super(initData)
    }
    create() {
        // 여기 나중에 최적화를 위해서 다 갈아엎어야함
        ctx.fillStyle = "black"
        ctx.fillRect(this.x, this.y, this.w, this.h)
        RenderingEngine.rectVertexes.push(
            {x: this.x, y: this.y},
            {x: this.x, y: (this.y + this.h)},
            {x: (this.x + this.w), y: (this.y + this.h)},
            {x: (this.x + this.w), y: this.y}
        )
        RenderingEngine.rectLines.push(
            new Line({x: this.x, y: this.y}, {x: this.x, y: (this.y + this.h)}),
            new Line({x: this.x, y: (this.y + this.h)}, {x: (this.x + this.w), y: (this.y + this.h)}),
            new Line({x: (this.x + this.w), y: (this.y + this.h)}, {x: (this.x + this.w), y: this.y}),
            new Line({x: (this.x + this.w), y: this.y}, {x: this.x, y: this.y}),
        )
        walls.set(this, this)
    }
}
class Ray {
    from: Axis
    to: Axis
    color: string
    constructor(from: Axis, to: Axis, color: string) {
        this.from = from
        this.to = to
        this.color = color
    }
    create() {
        ctx.strokeStyle = this.color
        ctx.beginPath()
        ctx.moveTo(this.from.x, this.from.y)
        ctx.lineTo(this.to.x, this.to.y)
        ctx.stroke()
    }
}
class Line {
    x1: number
    y1: number
    x2: number
    y2: number
    constructor(p1: Axis, p2: Axis) {
        this.x1 = p1.x
        this.y1 = p1.y
        this.x2 = p2.x
        this.y2 = p2.y
    }
}

class Rect {
    constructor(
        public x: number, 
        public y: number, 
        public endX: number, 
        public endY: number
    ){}
    isOverlappedWith(rect: Rect){
        const p1 = new Point2D(this.x, this.y)
        const p2 = new Point2D(this.endX, this.y)
        const p3 = new Point2D(this.x, this.endY)
        const p4 = new Point2D(this.endX, this.endY)

        return p1.checkInRect(rect) || p2.checkInRect(rect) || p3.checkInRect(rect) || p4.checkInRect(rect)
    }
}
class Point2D {
    constructor(public x: number, public y: number){}
    checkInRect(rect: Rect){
        return (
            this.x >= rect.x && this.x <= rect.endX && this.y >= rect.y && this.y <= rect.endY
        )
    }
}

class RenderingEngine {
    static rectLines: Array<Line> = []
    static rectVertexes: Array<Axis> = []
    static rayPoints: Array<Axis> = []
    static rotateAngle: number = 0.5
    static init() {

        new Wall({x: 50, y: 100, w: 100, h: 300}).create()
        new Wall({x: 200, y: 500, w: 400, h: 100}).create()
        new Wall({x: 500, y: 300, w: 100, h: 100}).create()
        new Wall({x: 200, y: 100, w: 50, h: 50}).create()
        new Wall({x: 300, y: 100, w: 50, h: 50}).create()
        new Wall({x: 400, y: 100, w: 50, h: 50}).create()

        const player = new Player({x: 300, y: 300, w: 50, h: 50})

        player.create()
        
        restoreIntersectionPoints(player, RenderingEngine.rotateAngle, 400)

        for(let i = 0; i < 360/RenderingEngine.rotateAngle; i++) {
            new Ray({x: player.getAxis().x, y: player.getAxis().y}, {x: RenderingEngine.rayPoints[i].x, y: RenderingEngine.rayPoints[i].y}, "red").create()
        }
    }
}
RenderingEngine.init()