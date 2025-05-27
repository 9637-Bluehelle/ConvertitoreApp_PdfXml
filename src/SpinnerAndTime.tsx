import React, { Component } from "react";

type ProgressAppProps = {
  totalFiles: number;
  gifPath: string;
  onClose: () => void; // Callback per chiudere il componente
};

type ProgressAppState = {
  runningFiles: number;
  elapsedTime: number;
  frameIndex: number;
};

class ProgressApp extends Component<ProgressAppProps, ProgressAppState> {
  private startTime: number;
  private estimatedTime: number;
  private gifRef: React.RefObject<HTMLImageElement>;

  constructor(props: ProgressAppProps) {
    super(props);
    this.state = {
      runningFiles: 0,
      elapsedTime: 0,
      frameIndex: 0,
    };
    this.startTime = Date.now();
    this.estimatedTime = props.totalFiles * 130;
    this.gifRef = React.createRef();
  }

  componentDidMount() {
    this.updateTime();
  }

  updateTime = () => {
    const interval = setInterval(() => {
      this.setState((prevState) => {
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        return { 
          elapsedTime, 
          frameIndex: (prevState.frameIndex + 1) % 10 
        };
      });

      // Check if all files are processed
      if (this.state.runningFiles >= this.props.totalFiles) {
        clearInterval(interval);
        this.props.onClose();
      }
    }, 1000);
  };

  formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${seconds} s`;
  }

  fileProcessed = () => {
    // Update runningFiles and check if it's time to close
    this.setState(
      (prevState) => ({ runningFiles: prevState.runningFiles + 1 }),
      () => {
        if (this.state.runningFiles >= this.props.totalFiles) {
            this.props.onClose();
        }
      }
    );
  };

  render() {
    const { gifPath } = this.props;
    const { elapsedTime } = this.state;

    return (
      <div className="progress-app">
        <div className="progress-info">
          <p>Tempo Stimato: {this.formatTime(this.estimatedTime)}</p>
          <p>Tempo Trascorso: {this.formatTime(elapsedTime)}</p>
        </div>
        <div className="gif-container">
          <img
            ref={this.gifRef}
            src={gifPath}
            alt="GIF"
            className="gif-animation"
            style={{ animation: "spin 1s steps(10) infinite" }}
          />
        </div>
      </div>
    );
  }
}

export default ProgressApp;