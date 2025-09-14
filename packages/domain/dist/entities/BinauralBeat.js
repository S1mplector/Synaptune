export class BinauralBeat {
    left;
    right;
    createdAt;
    constructor(props) {
        this.left = props.left;
        this.right = props.right;
        this.createdAt = props.createdAt ?? new Date();
    }
    static create(props) {
        if (props.left.hz <= 0 || props.right.hz <= 0) {
            throw new Error('Frequencies must be positive.');
        }
        return new BinauralBeat(props);
    }
    get beatFrequency() {
        return Math.abs(this.left.hz - this.right.hz);
    }
}
