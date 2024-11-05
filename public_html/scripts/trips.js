
$(window).ready(()=>{
    $('.value.trip').click((e) => {
        let link = $(e.currentTarget);

        let route_id = link.data('route_id');

console.log($.data);

        if (route_id) {
            viewManager.Create({
                curtain: $('.wrapper'),
                title: toLang('New order trip'),
                content: [
                    {
                        class: GroupFields,
                        content: [
                            {
                                name: 'StartPlace',
                                label: "StartPlace",
                                class: FormField
                            },{
                                name: 'FinishPlace',
                                label: "StartPlace",
                                class: FormField
                            },{
                                name: 'Time',
                                label: "Time",
                                class: DateTimeField
                            }
                        ]
                    }
                ]
            });
        }
    });
});