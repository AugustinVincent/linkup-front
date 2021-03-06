import { useState, useEffect, useRef } from "react"
import style from '../styles/components/ChatMessages.module.css'
import db from "../lib/firebase"
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const ChatMessages = ({user,toUser}) => {
    const [fromMessages, setFromMessages] = useState([])
    const [toMessages, setToMessages] = useState([])
    const [messages, setMessages] = useState([])

    const scroll = useRef()

    useEffect(async () => {
        if(!user.userId || !toUser.userId) return
        db.collection("messages")
        .where("toUserId", "==", user.userId)
        .where("fromUserId", "==", toUser.userId)
        .orderBy('createdAt')
        .limit(50)
        .onSnapshot((snapshot) => {
            setFromMessages(snapshot.docs.map(doc => doc.data()))
        })

        db.collection("messages")
        .where("toUserId", "==", toUser.userId)
        .where("fromUserId", "==",user.userId)
        .orderBy('createdAt')
        .limit(50)
        .onSnapshot((snapshot) => {
            setToMessages(snapshot.docs.map(doc => doc.data()))
        })
    },[user, toUser])

    useEffect(() => {
        const newMessagesArray = [...toMessages, ...fromMessages]
        function compare( a, b ) {
            if ( a.createdAt < b.createdAt ) return -1;
            if ( a.createdAt > b.createdAt ) return 1;
            return 0;
        }
        newMessagesArray.sort( compare );
        setMessages(newMessagesArray)
    }, [toMessages, fromMessages])

    return(
        <div className={style.messagesContainer}>
            <div className={style.chatInfos}>
                {toUser.name} {toUser.lastName}
            </div>
            <div className={style.messages}>
                {messages.map((message, index) => {
                    return(
                        <div key={index} className={`${style.message} ${user.userId == message.fromUserId ? style.from : style.to}`}>{message.text}</div>
                    )
                })}
                <div ref={scroll}></div>
            </div>
            

            <SendMessages user={user} toUser={toUser} scroll={scroll}/>
        </div>
    )
}


const SendMessages = ({user, toUser, scroll}) => {

    const [messageContent, setMessageContent] = useState('')

    const sendMessage = async (e) => {
        e.preventDefault()

        await db.collection('messages').add({
            text : messageContent,
            fromUserId : user.userId,
            toUserId : toUser.userId,
            userIds : [user.userId, toUser.userId],
            createdAt : firebase.firestore.FieldValue.serverTimestamp(),
        })
        setMessageContent('')
        console.log(scroll.current)
        scroll.current.scrollIntoView({behavior : 'smooth'})
    }

    return(
        <form className={style.sendMessageForm} onSubmit={sendMessage}>
            <input className={style.sendMessageInput}  type="text" value={messageContent} placeholder="Message" onChange={(e) => {setMessageContent(e.target.value)}}/>
            <button className={style.sendMessageButton}  type="submit">Envoyer</button>
        </form>
    )
}

export default ChatMessages