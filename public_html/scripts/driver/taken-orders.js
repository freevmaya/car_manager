class TakenOrders extends OrderManager {
    #taken_orders;
    selOrderView;
    #path;
    #graph;

    get Graph() { return this.#graph; }

    get TakenOrders() { return this.#taken_orders; }
    get TopOrder() { return this.#taken_orders.length > 0 ? this.#taken_orders[0] : null; }
    get Path() { return this.#path; }
    get length() { return this.#taken_orders.length; }

    constructor(ordersData) {

        super(ordersData);
        this.Reset();
        this.showImportantOrder();
    }

    doChangeOrder(order, part_order) {
        super.doChangeOrder(order, part_order);

        if ((order.driver_id == user.asDriver) && (order.state != 'wait_meeting'))
            this.Reset();
    }

    Reset() {
        this.ResetPath();
        if ((this.#taken_orders.length > 0) && (this.#taken_orders[0].state == 'accepted'))
            this.#taken_orders[0].SetState('driver_move');
    }

    #getTakenOrders() {

        let result = [];
        this.Items.forEach((o)=>{
            if (TRACESTATES.includes(o.state) && (o.driver_id == user.asDriver)) {
                if (o.state == 'accepted') {
                    if (o.isPickUpNow)
                        result.push(o);
                }
                else result.push(o);
            }
        });

        result.sort((order1, order2)=>{
            return TRACESTATES.indexOf(order1.state) - TRACESTATES.indexOf(order2.state);
        });
        return result;
    }

    ResetPath(mainPoint) {
        this.#taken_orders = [];
        let takenOrders = this.#getTakenOrders();
        if (takenOrders.length > 0) {
        
            this.#graph = new GraphGenerator(mainPoint ? mainPoint : v_map.getMainPosition());
            this.#graph.AddOrders(takenOrders);

            this.#path = this.#graph.getPath();
            for (let i=0; i<this.#path.length; i++) {
                let order = this.#path[i].start;
                if (order && !this.#taken_orders.includes(order))
                    this.#taken_orders.push(order);
            }
        } else this.#path = [];

        this.SendEvent('CHANGE_PATH', this.#path);

        return this.#path;
    }

    showImportantOrder(order_id = null) {
        if (!this.takenOrdersView) {
            this.takenOrdersView = viewManager.Create({
                bottomAlign: true,
                template: 'takenOrderView',
                orders: this,
                actions:  {}
            }, TracerOrderView, (()=>{
                this.takenOrdersView = null;
            }).bind(this));
        }

        if (this.takenOrdersView && order_id) 
            this.takenOrdersView.togglePathOrder(order_id);
    }

    remaindDistance() {
        let result = 0;
        for (let i=0; i<this.#taken_orders.length; i++)
            result += this.#taken_orders[i].remaindDistance;
        return result;
    }

    isShown(order_id) {
        return this.selOrderView && (this.selOrderView.Order.id == order_id);
    }

    GetMarker(markerOrOrderId) {
        return isNumeric(markerOrOrderId) ? v_map.MarkerManager.MarkerByOrderId(markerOrOrderId) : markerOrOrderId;
    }

    ShowOrderPreview(markerOrOrderId, haveActions = true) {

        let marker = this.GetMarker(markerOrOrderId);
        let order = marker.order;
        let actions = {};

        if (haveActions) {
            if (['expired', 'accepted'].includes(order.state) && (parseInt(order.driver_id) == user.asDriver))
                $.extend(actions, {
                    'Continue': 'this.continueOrder.bind(this)'
                });

            if (order.state == 'wait')
                $.extend(actions, {
                    'Offer to perform': 'this.offerToPerform.bind(this)'
                });
        }

        function showPathAndInfo() {

            this.selOrderView = viewManager.Create({
                bottomAlign: true,
                template: 'orderView',
                order: order,
                marker: marker,
                content: [
                    {
                        label: "InfoPath",
                        content: templateClone('offerView', order),// $(DataView.getOrderInfo(order, true)),
                        class: HtmlField
                    }
                ],
                actions: actions
            }, OrderView, (()=>{
                this.selOrderView = null;
            }).bind(this));
        }

        if (this.selOrderView) 
            this.selOrderView.Close().then(showPathAndInfo.bind(this));
        else showPathAndInfo.bind(this)();
    }

    ShowInfoOrder(markerOrOrderId) {
        let marker = this.GetMarker(markerOrOrderId);
        let order = marker.order;
        if (this.#taken_orders.find((e) => e.id == order.id))
            this.showImportantOrder(order.id);
        else this.ShowOrderPreview(markerOrOrderId);
    }
}