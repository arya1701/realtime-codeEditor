import React ,{useState,useRef, useEffect} from 'react';
import Client from '../components/Client';
import Editor from '../components/Editor';
import ACTIONS from '../Actions';
import {useLocation, useNavigate, Navigate,useParams } from 'react-router-dom';
import { initSocket } from '../socket';
import toast from 'react-hot-toast';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);

    const location = useLocation();
    const reactNavigator = useNavigate();
    const {roomId} = useParams();

    const [clients,setClients] = useState([]);

    useEffect(()=>{

        const init = async ()=>{
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error',(err)=>handleErrors(err));
            socketRef.current.on('connect_failed',(err)=>handleErrors(err));

            function handleErrors(e){
                // console.log('socket error',e);
                toast.error('Socket connection failed,try again later');
                reactNavigator('/');
                
            }


    
            socketRef.current.emit(ACTIONS.JOIN,{
                roomId,
                username:location.state?.username,
            });

            // listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({clients,username,socketId}) =>{
                    if(username !== location.state?.username){
                        toast.success(`${username} joined the room`);
                        // console.log(`${username} joined`);
                        
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE,{
                        code:codeRef.current,
                        socketId,
                    });
                }
            )
            // litening for disconnected
            socketRef.current.on(ACTIONS.DISCONNECTED,({socketId,username})=>{
                toast.success(`${username} left the room`);
                setClients((prev)=>{
                    return prev.filter(
                        (client) => client.socketId !== socketId
                    );
                });
            })
        };
        init();
        return ()=>{
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);

            socketRef.current.disconnect();
        }
    },[])
    
    async function copyRoomId(){
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success("Room Id has been copied to your clipboard");
        } catch (err) {
            toast.error('could not copy the Room Id');

        }
    }

    function leaveRoom(){
        reactNavigator('/');
    }


    if(!location.state){
        return <Navigate to="/" />;
    }

  return (
    <div className="mainWrap">
        <div className="aside">
            <div className="asideInner">
                <div className="logo">
                    <img className='editorPageLogo' src="/brandLogo.png" alt="" />
                    <h3>Connected</h3>
                    <div className="clientsList">
                    {
                        clients.map((client) => (<Client key={client.socketId} username={client.username} />))
                    }

                    </div>
                </div>
            </div>
            <button className='btn copyBtn' onClick={copyRoomId}>Copy Room ID</button>
            <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
        </div>
        <div className="editorWrap">
        <Editor socketRef={socketRef} roomId={roomId} onCodeChange = {(code) =>{codeRef.current = code;}}/>
        </div>
    </div>
  )
}

export default EditorPage