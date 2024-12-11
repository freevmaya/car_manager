<table class="orderInfo">
	<tr>
		<td>{toLang('State')}:</td><td>{state}</td>
	</tr>
	<tr>
		<td>{PlaceName(data.start)} > </td><td>{PlaceName(data.finish)}</td>
	</tr>
	<tr>
		<td>{toLang("User")}:</td><td>{username}</td>
	</tr>
	<tr>
		<td>{toLang("Departure time")}</td><td>{$.format.date(data.pickUpTime, dateTinyFormat))}</td>
	</tr>
	<tr>
		<td>{toLang("Length")}</td><td>{DistanceToStr(data.meters)}</td>
	</tr>
</table>