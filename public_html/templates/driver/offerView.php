<div class="offerView">
	<table class="orderDetail">
			<tr>
				<td>{toLang('State')}:</td><td id="state-{id}">{state}</td>
			</tr>
			<tr>
				<td>{toLang("User")}:</td><td>{getUserName(data)}</td>
			</tr>
			<tr class="stayParam">
				<td>{toLang("Departure time")}:</td><td>{$.format.date(data.pickUpTime, dateTinyFormat)}</td>
			</tr>
			<tr class="stayParam">
				<td>{toLang("Length")}:</td><td>{DistanceToStr(data.meters)}</td>
			</tr>
			<tr class="stayParam">
				<td>{toLang("Seats")}:</td><td>{seats}</td>
			</tr>
		</table>
</div>