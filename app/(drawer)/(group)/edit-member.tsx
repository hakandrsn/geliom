import {StyleSheet, View} from "react-native";
import {useUser} from "@/api";

type MemberProps = {
    id: string;
}

export default function EditMember(props:MemberProps){
    const {id} = props;
    const {data:otherUser} = useUser(id);
    console.log("otherUser: ",otherUser);
    return(
        <View style={styles.container}></View>
    )
}

const styles = StyleSheet.create({
    container: {flex: 1},
})