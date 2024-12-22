<div class="offerView">
	<table class="orderDetail">
		<tr>
			<td>{toLang("Route")}:</td><td><span class="place">{PlaceName(data.start)}</span> > <span class="place">{PlaceName(data.finish)}</span></td>
		</tr>
		<tr>
			<td>{toLang("User")}:</td><td>{getUserName(data)}</td>
		</tr>
		<tr>
			<td>{toLang("Departure time")}:</td><td>{$.format.date(data.pickUpTime, dateTinyFormat)}</td>
		</tr>
		<tr>
			<td>{toLang("Length")}:</td><td>{DistanceToStr(data.meters)}</td>
		</tr>
		<tr>
			<td>{toLang("Seats")}:</td><td>{seats}</td>
		</tr>
	</table>
</div>