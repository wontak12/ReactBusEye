import alarmImg from "../images/alarm.png";
import settingImg from "../images/setting.png";

function Gnb(){
    return (
        <div>
            <div className="gnbBar">
                <div className="TRP left">TRP</div>
                <div className="right">
                    <div className="imgDiv">
                        <img src={alarmImg}></img>
                        <img src={settingImg}></img>
                    </div>
                    <div className="name">김원탁</div>
                    

                </div>
            </div>
        </div>
    )
}

export default Gnb