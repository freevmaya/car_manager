var startOrders;
function Mechanics() {

    transport.AddListener('notificationList', 
        v_map.MarkerManager.onNotificationList.bind(v_map.MarkerManager));

    v_map.MarkerManager.AddOrders(startOrders);
}