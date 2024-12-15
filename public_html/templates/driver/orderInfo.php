<table class="orderInfo">
	<tr>
		<td>{toLang('State')}:</td><td id="state-{id}">{state}</td>
	</tr>
	<tr>
		<td colspan="2" class="route"><span>{PlaceName(data.start)}</span><span class="to">></span><span>{PlaceName(data.finish)}</span></td>
	</tr>
	<tr>
		<td>{toLang("User")}:</td><td>{username}</td>
	</tr>
	<tr>
		<td>{toLang("Departure time")}</td><td>{$.format.date(data.pickUpTime, dateTinyFormat)}</td>
	</tr>
	<tr>
		<td>{toLang("Length")}</td><td>{DistanceToStr(data.meters)}</td>
	</tr>
	<tr>
		<td>{toLang("Seats")}</td><td>{seats}</td>
	</tr>
</table>