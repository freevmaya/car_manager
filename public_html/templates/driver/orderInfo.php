<div class="orderInfo">
	<div class="cols">
		<table>
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
			<tr class="dynParam">
				<td>{toLang("Remaining distance")}:</td><td class="remaindDistance">{remaindDistance}</td>
			</tr>
			<tr class="dynParam">
				<td>{toLang("Remaind time")}:</td><td class="remaindTime">0</td>
			</tr>
			<tr class="dynParam">
				<td>{toLang("Average speed")}:</td><td class="avgSpeed">0</td>
			</tr>
		</table>
		<div>
			Right block
		</div>
	</div>
</div>